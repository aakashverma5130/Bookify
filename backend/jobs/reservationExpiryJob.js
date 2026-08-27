const db = require('../config/db');
const notificationService = require('../services/notificationService');

/**
 * Reservation expiry job.
 *
 * Runs frequently (every 5 minutes) via node-cron to enforce the 24-hour
 * pickup window for book reservations. For every NOTIFIED reservation whose
 * `expiry_date` has passed:
 *   1. Mark the reservation as EXPIRED.
 *   2. Notify the student that their hold lapsed.
 *   3. Release the held `book_copies` row (RESERVED → AVAILABLE) so it
 *      can be re-issued or picked up by the next student in the waitlist.
 *   4. Promote the next WAITING reservation for that book to NOTIFIED with
 *      a fresh 24-hour hold, mark the copy RESERVED again, and notify the
 *      student.
 *
 * Schema reminder:
 *   book_reservations.status IN ('WAITING','NOTIFIED','FULFILLED','EXPIRED','CANCELLED')
 *   book_copies.status     IN ('AVAILABLE','ISSUED','DAMAGED','LOST','RESERVED')
 */
const RESERVATION_HOLD_HOURS = 24;
const HOLD_MS = RESERVATION_HOLD_HOURS * 60 * 60 * 1000;

const reservationExpiryJob = async () => {
  console.log('[RESERVATION] Starting reservation expiry sweep...');
  let expiredCount = 0;
  let promotedCount = 0;
  let releasedCount = 0;
  let errorCount = 0;

  try {
    // 1. Find every NOTIFIED reservation whose hold has expired. We also grab
    //    the book_id so we can re-promote the next person afterwards.
    //    Note: wrap expiry_date in `datetime(...)` so the comparison works
    //    correctly in both PostgreSQL and SQLite — ISO 8601 strings with a
    //    'T' separator sort incorrectly against 'YYYY-MM-DD HH:MM:SS' in
    //    SQLite's lexicographic comparison.
    const expired = await db.query(
      `SELECT reservation_id, book_id, student_id, expiry_date
         FROM book_reservations
        WHERE status = 'NOTIFIED'
          AND expiry_date IS NOT NULL
          AND datetime(expiry_date) < datetime('now')`
    );

    if (!expired.rows.length) {
      console.log('[RESERVATION] No expired holds to process.');
      return { expiredCount: 0, promotedCount: 0, releasedCount: 0, errorCount: 0 };
    }

    for (const row of expired.rows) {
      try {
        // 2. Mark the reservation EXPIRED atomically. We update by
        //    (book_id, student_id, status) rather than reservation_id so
        //    the query is also safe on the SQLite fallback where the
        //    reservation_id column is nullable (no DEFAULT gen_random_uuid()).
        const upd = await db.query(
          `UPDATE book_reservations
              SET status = 'EXPIRED', updated_at = datetime('now')
            WHERE book_id = $1 AND student_id = $2 AND status = 'NOTIFIED'`,
          [row.book_id, row.student_id]
        );
        if (!upd.rowCount) {
          // Already mutated by a concurrent sweep — skip.
          continue;
        }
        expiredCount++;

        // 3. Release the held copy if it is still RESERVED for this book.
        //    (It may have already been re-issued or moved by another flow.)
        const release = await db.query(
          `UPDATE book_copies
              SET status = 'AVAILABLE', updated_at = datetime('now')
            WHERE book_id = $1 AND status = 'RESERVED'`,
          [row.book_id]
        );
        if (release.rowCount) releasedCount++;

        // 4. Notify the student whose hold lapsed.
        const userRes = await db.query(
          `SELECT u.user_id FROM users u
             JOIN students s ON s.user_id = u.user_id
            WHERE s.student_id = $1`,
          [row.student_id]
        );
        if (userRes.rows.length) {
          await notificationService.createNotification({
            userId:  userRes.rows[0].user_id,
            type:    'RESERVATION_EXPIRED',
            title:   'Your Reserved Book Hold Has Expired',
            message: `Your hold for this book was not collected within ${RESERVATION_HOLD_HOURS} hours and has been released to the next student.`,
            metadata: { reservationId: row.reservation_id, bookId: row.book_id },
          }).catch(err => {
            console.error('[RESERVATION] Failed to notify expired holder:', err.message);
          });
        }

        // 5. Promote the next WAITING reservation, if any, to NOTIFIED with
        //    a fresh hold, and re-mark a free copy as RESERVED.
        const nextRes = await db.query(
          `SELECT reservation_id, student_id
             FROM book_reservations
            WHERE book_id = $1 AND status = 'WAITING'
            ORDER BY queue_position ASC, reservation_date ASC
            LIMIT 1`,
          [row.book_id]
        );

        if (nextRes.rows.length) {
          const next = nextRes.rows[0];
          const newExpiry = new Date(Date.now() + HOLD_MS);

          await db.query(
            `UPDATE book_reservations
                SET status = 'NOTIFIED', expiry_date = $1, updated_at = datetime('now')
              WHERE book_id = $2 AND student_id = $3 AND status = 'WAITING'`,
            [newExpiry.toISOString(), row.book_id, next.student_id]
          );
          promotedCount++;

          // Re-hold a copy. If multiple copies are AVAILABLE pick one.
          await db.query(
            `UPDATE book_copies
                SET status = 'RESERVED', updated_at = datetime('now')
              WHERE copy_id = (
                SELECT copy_id FROM book_copies
                 WHERE book_id = $1 AND status = 'AVAILABLE'
                 ORDER BY copy_id ASC
                 LIMIT 1
              )`,
            [row.book_id]
          );

          // Notify the next-in-line student.
          const nextUser = await db.query(
            `SELECT u.user_id FROM users u
               JOIN students s ON s.user_id = u.user_id
              WHERE s.student_id = $1`,
            [next.student_id]
          );
          if (nextUser.rows.length) {
            await db.query(
              `SELECT title FROM books WHERE book_id = $1`,
              [row.book_id]
            ).then(titleRes => {
              const title = titleRes.rows[0]?.title || 'the book';
              return notificationService.createNotification({
                userId:  nextUser.rows[0].user_id,
                type:    'RESERVATION',
                title:   'Your Reserved Book is Available!',
                message: `A copy of "${title}" is now available for you. Please collect it from the library within ${RESERVATION_HOLD_HOURS} hours — your hold will expire after that.`,
                metadata: { reservationId: next.reservation_id, bookId: row.book_id },
              });
            }).catch(err => {
              console.error('[RESERVATION] Failed to notify next holder:', err.message);
            });
          }
        }
      } catch (innerErr) {
        errorCount++;
        console.error('[RESERVATION] Failed to process expired reservation',
          row.reservation_id, ':', innerErr.message);
      }
    }

    console.log(`[RESERVATION] Sweep complete — expired: ${expiredCount}, promoted: ${promotedCount}, copies released: ${releasedCount}, errors: ${errorCount}`);
    return { expiredCount, promotedCount, releasedCount, errorCount };
  } catch (err) {
    console.error('[RESERVATION] Job error:', err.message);
    throw err;
  }
};

/**
 * Lazy sweep: a lightweight, per-call helper used by the reservations
 * read endpoint to mark any overdue holds as EXPIRED before serializing
 * the response. This guarantees the UI never sees a "ghost" reservation
 * with status=NOTIFIED past its expiry, even if the cron sweep hasn't
 * run yet.
 *
 * Returns the list of reservation_ids that were transitioned to EXPIRED
 * (caller may also choose to call the full job for the cascade, but for
 * the read path we just need the status to be correct).
 */
const lazyExpireOverdueReservations = async () => {
  try {
    await db.query(
      `UPDATE book_reservations
          SET status = 'EXPIRED', updated_at = datetime('now')
        WHERE status = 'NOTIFIED'
          AND expiry_date IS NOT NULL
          AND datetime(expiry_date) < datetime('now')`
    );
  } catch (err) {
    // Non-fatal: log and continue serving the request.
    console.error('[RESERVATION] Lazy expiry sweep error:', err.message);
  }
};

module.exports = {
  reservationExpiryJob,
  lazyExpireOverdueReservations,
  RESERVATION_HOLD_HOURS,
};
