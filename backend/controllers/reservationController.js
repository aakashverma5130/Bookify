const db = require('../config/db');
const { withTransaction } = require('../config/db');
const notificationService = require('../services/notificationService');
const {
  lazyExpireOverdueReservations,
  reservationExpiryJob,
} = require('../jobs/reservationExpiryJob');

/**
 * POST /api/reservations
 * Student joins the waitlist for a book.
 */
const createReservation = async (req, res) => {
  const { bookId } = req.body;
  if (!bookId) return res.status(400).json({ error: 'bookId is required' });

  try {
    // Get student_id from req.user
    const studentResult = await db.query(
      `SELECT student_id FROM students WHERE user_id = $1`,
      [req.user.userId]
    );
    if (!studentResult.rows.length) {
      return res.status(403).json({ error: 'Only students can reserve books' });
    }
    const studentId = studentResult.rows[0].student_id;

    // Self-heal: if the previous holder's 24h hold just lapsed but the cron
    // hasn't run yet, run the expiry sweep now so availability is correct.
    await reservationExpiryJob();

    const result = await withTransaction(async (client) => {
      // Check book exists
      const bookResult = await client.query(
        `SELECT book_id, title, available_copies FROM books WHERE book_id = $1`,
        [bookId]
      );
      if (!bookResult.rows.length) throw Object.assign(new Error('Book not found'), { status: 404 });

      // Can't reserve if copies are available — should borrow instead
      if (bookResult.rows[0].available_copies > 0) {
        throw Object.assign(new Error('Copies are available — please borrow instead of reserving'), { status: 409 });
      }

      // Check for existing active reservation
      const existing = await client.query(
        `SELECT reservation_id FROM book_reservations
         WHERE book_id = $1 AND student_id = $2 AND status IN ('WAITING','NOTIFIED')`,
        [bookId, studentId]
      );
      if (existing.rows.length) {
        throw Object.assign(new Error('You already have an active reservation for this book'), { status: 409 });
      }

      // Get next queue position
      const queueResult = await client.query(
        `SELECT COALESCE(MAX(queue_position), 0) + 1 AS next_pos
         FROM book_reservations
         WHERE book_id = $1 AND status IN ('WAITING','NOTIFIED')`,
        [bookId]
      );
      const queuePosition = queueResult.rows[0].next_pos;

      const resResult = await client.query(
        `INSERT INTO book_reservations (book_id, student_id, status, queue_position)
         VALUES ($1, $2, 'WAITING', $3)
         RETURNING reservation_id, queue_position`,
        [bookId, studentId, queuePosition]
      );

      return { reservation: resResult.rows[0], bookTitle: bookResult.rows[0].title };
    });

    res.status(201).json({
      message:        'Added to waitlist',
      reservationId:  result.reservation.reservation_id,
      queuePosition:  result.reservation.queue_position,
      bookTitle:      result.bookTitle,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to create reservation' });
  }
};

/**
 * DELETE /api/reservations/:id
 */
const cancelReservation = async (req, res) => {
  try {
    const studentResult = await db.query(
      `SELECT student_id FROM students WHERE user_id = $1`,
      [req.user.userId]
    );
    const studentId = studentResult.rows[0]?.student_id;

    // L-7: explicit guard so a non-student (librarian with no `students`
    // row) cannot accidentally pass `undefined` to the SQL, which would
    // either match nothing (PG) or fail in a confusing way (SQLite).
    if (!studentId) {
      return res.status(403).json({ error: 'Only students can cancel reservations' });
    }

    const result = await db.query(
      `UPDATE book_reservations
       SET status = 'CANCELLED', updated_at = NOW()
       WHERE reservation_id = $1 AND student_id = $2 AND status IN ('WAITING','NOTIFIED')
       RETURNING reservation_id`,
      [req.params.id, studentId]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Reservation not found' });
    res.json({ message: 'Reservation cancelled' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel reservation' });
  }
};

/**
 * GET /api/reservations
 * Librarian: all; Student: own only
 */
const getReservations = async (req, res) => {
  try {
    // Lazy sweep: ensure no NOTIFIED row past its expiry is returned to the
    // client. The dedicated cron job handles the full cascade (notify next,
    // release held copy, etc.); this just keeps the read path consistent.
    await lazyExpireOverdueReservations();

    let where = '';
    const params = [];

    if (req.user.role === 'STUDENT') {
      const s = await db.query(`SELECT student_id FROM students WHERE user_id = $1`, [req.user.userId]);
      params.push(s.rows[0]?.student_id);
      where = `WHERE br.student_id = $1`;
    }

    const result = await db.query(
      `SELECT br.reservation_id, br.book_id, br.student_id, br.reservation_date,
              br.expiry_date, br.status, br.queue_position,
              b.title AS book_title, b.cover_image_url,
              a.name AS author_name,
              u.name AS student_name, s.enrollment_no
       FROM book_reservations br
       JOIN books b    ON b.book_id    = br.book_id
       LEFT JOIN authors a ON a.author_id = b.author_id
       JOIN students s ON s.student_id = br.student_id
       JOIN users u    ON u.user_id    = s.user_id
       ${where}
       ORDER BY br.queue_position ASC, br.reservation_date ASC`,
      params
    );

    res.json({ reservations: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
};

module.exports = { createReservation, cancelReservation, getReservations };
