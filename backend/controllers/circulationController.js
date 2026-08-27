const db = require('../config/db');
const { withTransaction } = require('../config/db');
const fineService = require('../services/fineService');
const notificationService = require('../services/notificationService');

/**
 * POST /api/issues
 * Issue a book to a student.
 * Body: { studentId, copyId } (librarian scans barcode → gets copyId)
 */
const issueBook = async (req, res) => {
  const { studentId, copyId, issuedBy } = req.body;
  if (!studentId || !copyId) {
    return res.status(400).json({ error: 'studentId and copyId are required' });
  }

  try {
    const result = await withTransaction(async (client) => {
      // 1. Verify copy is AVAILABLE
      const copyResult = await client.query(
        `SELECT bc.copy_id, bc.book_id, bc.status, bc.accession_number,
                b.title AS book_title
         FROM book_copies bc
         JOIN books b ON b.book_id = bc.book_id
         WHERE bc.copy_id = $1
         FOR UPDATE`,
        [copyId]
      );

      if (!copyResult.rows.length) {
        throw Object.assign(new Error('Copy not found'), { status: 404 });
      }

      const copy = copyResult.rows[0];
      if (copy.status !== 'AVAILABLE') {
        throw Object.assign(
          new Error(`Copy is not available. Current status: ${copy.status}`),
          { status: 409 }
        );
      }

      // 2. Check student's active issue count vs limit
      const settingsResult = await client.query(
        `SELECT max_books_per_student, default_loan_days FROM library_settings LIMIT 1`
      );
      const settings = settingsResult.rows[0];

      const activeIssues = await client.query(
        `SELECT COUNT(*) FROM issues WHERE student_id = $1 AND status IN ('ISSUED','OVERDUE')`,
        [studentId]
      );

      if (parseInt(activeIssues.rows[0].count) >= settings.max_books_per_student) {
        throw Object.assign(
          new Error(`Student has reached the maximum of ${settings.max_books_per_student} borrowed books`),
          { status: 409 }
        );
      }

      // 3. Check student has no unpaid fines (optional policy — check library_settings)
      // (Skipped for now — can be added as a settings flag)

      // 4. Create issue record
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + settings.default_loan_days);

      const issueResult = await client.query(
        `INSERT INTO issues (copy_id, student_id, issue_date, due_date, issued_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING issue_id, issue_date, due_date`,
        [copyId, studentId, today.toISOString().slice(0, 10), dueDate.toISOString().slice(0, 10), issuedBy || req.user.userId]
      );

      // 5. Mark copy as ISSUED
      await client.query(
        `UPDATE book_copies SET status = 'ISSUED', updated_at = NOW() WHERE copy_id = $1`,
        [copyId]
      );

      // 5b. If this student had an active (NOTIFIED) reservation for this book,
      // mark it FULFILLED — they picked up the reserved copy. We update by
      // (book_id, student_id) since the SQLite fallback's reservation_id is
      // nullable (no DEFAULT).
      await client.query(
        `UPDATE book_reservations
            SET status = 'FULFILLED', updated_at = datetime('now')
          WHERE book_id = $1 AND student_id = $2
            AND status = 'NOTIFIED'`,
        [copy.book_id, studentId]
      );

      return { issue: issueResult.rows[0], copy, settings };
    });

    // 6. Send notification (outside transaction — failure here doesn't roll back the issue)
    const studentUser = await db.query(
      `SELECT u.user_id FROM users u JOIN students s ON s.user_id = u.user_id WHERE s.student_id = $1`,
      [studentId]
    );
    if (studentUser.rows.length) {
      await notificationService.createNotification({
        userId:  studentUser.rows[0].user_id,
        type:    'DUE_REMINDER',
        title:   'Book Issued',
        message: `"${result.copy.book_title}" has been issued to you. Due date: ${result.issue.due_date}. Please return on time to avoid fines.`,
        metadata: { copyId, bookId: result.copy.book_id },
      });
    }

    return res.status(201).json({
      message: 'Book issued successfully',
      issueId:   result.issue.issue_id,
      issueDate: result.issue.issue_date,
      dueDate:   result.issue.due_date,
      bookTitle: result.copy.book_title,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Failed to issue book' });
  }
};

/**
 * PUT /api/issues/:id/return
 * Return a book. Calculates fines, handles reservation queue.
 * Body: { condition: 'GOOD' | 'DAMAGED', notes? }
 */
const returnBook = async (req, res) => {
  const { condition = 'GOOD', notes } = req.body;
  const issueId = req.params.id;

  try {
    const result = await withTransaction(async (client) => {
      // 1. Lock and fetch the open issue
      const issueResult = await client.query(
        `SELECT i.issue_id, i.copy_id, i.student_id, i.due_date, i.status,
                bc.book_id, bc.accession_number,
                b.title AS book_title
         FROM issues i
         JOIN book_copies bc ON bc.copy_id = i.copy_id
         JOIN books b        ON b.book_id   = bc.book_id
         WHERE i.issue_id = $1 AND i.status IN ('ISSUED','OVERDUE')
         FOR UPDATE OF i, bc`,
        [issueId]
      );

      if (!issueResult.rows.length) {
        throw Object.assign(new Error('Issue not found or already returned'), { status: 404 });
      }

      const issue = issueResult.rows[0];
      const today = new Date().toISOString().slice(0, 10);

      // 2. Calculate overdue fine
      const { amount: overdueAmount, overdueDays } = await fineService.calculateFine(issueId, client);
      let totalFineAmount = overdueAmount;

      // 3. Create overdue fine if applicable
      if (overdueAmount > 0) {
        await fineService.createFine({
          issueId,
          studentId: issue.student_id,
          amount: overdueAmount,
          reason: 'OVERDUE',
          notes:  `${overdueDays} days overdue`,
          client,
        });
      }

      // 4. Create damage fine if applicable
      if (condition === 'DAMAGED') {
        // Fixed damage fine: Rs. 50 (could be made configurable in library_settings)
        const damageFineAmount = 50;
        await fineService.createFine({
          issueId,
          studentId: issue.student_id,
          amount: damageFineAmount,
          reason: 'DAMAGE',
          notes:  notes || 'Book returned in damaged condition',
          client,
        });
        totalFineAmount += damageFineAmount;
      }

      // 5. Update issue record
      await client.query(
        `UPDATE issues
         SET return_date = $1, status = 'RETURNED', returned_to = $2, updated_at = NOW()
         WHERE issue_id = $3`,
        [today, req.user.userId, issueId]
      );

      // 6. Update copy status
      const newCopyStatus = condition === 'DAMAGED' ? 'DAMAGED' : 'AVAILABLE';
      await client.query(
        `UPDATE book_copies
         SET status = $1, condition_notes = $2, updated_at = NOW()
         WHERE copy_id = $3`,
        [newCopyStatus, notes || null, issue.copy_id]
      );

      // 7. Check reservation queue — if copy is going back AVAILABLE, notify next in queue
      let nextReservation = null;
      if (newCopyStatus === 'AVAILABLE') {
        const queueResult = await client.query(
          `SELECT reservation_id, student_id
           FROM book_reservations
           WHERE book_id = $1 AND status = 'WAITING'
           ORDER BY queue_position ASC
           LIMIT 1`,
          [issue.book_id]
        );

        if (queueResult.rows.length) {
          nextReservation = queueResult.rows[0];
          const holdExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour pickup window

          await client.query(
            `UPDATE book_reservations
             SET status = 'NOTIFIED', expiry_date = $1, updated_at = datetime('now')
             WHERE book_id = $2 AND student_id = $3 AND status = 'WAITING'`,
            [holdExpiry.toISOString(), issue.book_id, nextReservation.student_id]
          );

          // Temporarily mark copy as RESERVED so no one else grabs it
          await client.query(
            `UPDATE book_copies SET status = 'RESERVED', updated_at = datetime('now') WHERE copy_id = $1`,
            [issue.copy_id]
          );
        }
      }

      return { issue, totalFineAmount, overdueAmount, overdueDays, nextReservation, newCopyStatus };
    });

    // 8. Notifications (outside transaction)
    const studentUserResult = await db.query(
      `SELECT u.user_id FROM users u JOIN students s ON s.user_id = u.user_id WHERE s.student_id = $1`,
      [result.issue.student_id]
    );

    if (studentUserResult.rows.length) {
      const uid = studentUserResult.rows[0].user_id;
      const fineMsg = result.totalFineAmount > 0
        ? ` Fine of Rs. ${result.totalFineAmount.toFixed(2)} has been applied.`
        : ' No fine — returned on time!';

      await notificationService.createNotification({
        userId:  uid,
        type:    'GENERAL',
        title:   'Book Returned',
        message: `"${result.issue.book_title}" has been returned successfully.${fineMsg}`,
        metadata: { issueId, fineAmount: result.totalFineAmount },
      });
    }

    // Notify next reservation holder
    if (result.nextReservation) {
      const nextUserResult = await db.query(
        `SELECT u.user_id FROM users u JOIN students s ON s.user_id = u.user_id WHERE s.student_id = $1`,
        [result.nextReservation.student_id]
      );
      if (nextUserResult.rows.length) {
        await notificationService.createNotification({
          userId:  nextUserResult.rows[0].user_id,
          type:    'RESERVATION',
          title:   'Your Reserved Book is Available!',
          message: `A copy of "${result.issue.book_title}" is now available for you. Please collect it from the library within 24 hours — your hold will expire after that.`,
        });
      }
    }

    return res.json({
      message:       'Book returned successfully',
      overdueDays:   result.overdueDays,
      fineAmount:    result.totalFineAmount,
      copyStatus:    result.newCopyStatus,
      nextInQueue:   result.nextReservation?.student_id || null,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Failed to return book' });
  }
};

/**
 * GET /api/issues
 * Query: status, studentId, page, limit
 */
const getIssues = async (req, res) => {
  try {
    const { status, studentId, page = 1, limit = 20 } = req.query;
    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset   = (pageNum - 1) * limitNum;

    const params = [];
    let where = 'WHERE 1=1';

    if (status) {
      params.push(status.toUpperCase());
      where += ` AND i.status = $${params.length}`;
    }
    if (studentId) {
      params.push(studentId);
      where += ` AND i.student_id = $${params.length}`;
    }

    params.push(limitNum, offset);
    const result = await db.query(
      `SELECT i.issue_id, i.issue_date, i.due_date, i.return_date, i.status,
              i.renewal_count,
              bc.accession_number, bc.copy_id,
              b.book_id, b.title AS book_title, b.isbn, b.cover_image_url,
              a.name AS author_name,
              s.student_id, u.name AS student_name, u.email AS student_email,
              s.enrollment_no,
              GREATEST(0, CURRENT_DATE - i.due_date) AS overdue_days,
              GREATEST(0, i.due_date - CURRENT_DATE) AS days_remaining,
              COALESCE(f.amount, 0) AS fine_amount
       FROM issues i
       JOIN book_copies bc  ON bc.copy_id    = i.copy_id
       JOIN books b         ON b.book_id     = bc.book_id
       LEFT JOIN authors a  ON a.author_id   = b.author_id
       JOIN students s      ON s.student_id  = i.student_id
       JOIN users u         ON u.user_id     = s.user_id
       LEFT JOIN fines f    ON f.issue_id    = i.issue_id
       ${where}
       ORDER BY i.due_date ASC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ issues: result.rows });
  } catch (err) {
    console.error('[CIRCULATION] getIssues error:', err.message);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
};

/**
 * GET /api/issues/overdue
 */
const getOverdueIssues = async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM v_active_issues WHERE status = 'OVERDUE' OR due_date < CURRENT_DATE ORDER BY due_date ASC`
    );
    res.json({ issues: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch overdue issues' });
  }
};

/**
 * POST /api/issues/:id/renew
 */
const renewBook = async (req, res) => {
  const issueId = req.params.id;
  try {
    const result = await withTransaction(async (client) => {
      const issueResult = await client.query(
        `SELECT i.*, ls.renewal_limit, ls.default_loan_days
         FROM issues i CROSS JOIN library_settings ls
         WHERE i.issue_id = $1 AND i.status IN ('ISSUED','OVERDUE')
         FOR UPDATE OF i`,
        [issueId]
      );

      if (!issueResult.rows.length) {
        throw Object.assign(new Error('Issue not found or already returned'), { status: 404 });
      }

      const issue = issueResult.rows[0];

      if (issue.renewal_count >= issue.renewal_limit) {
        throw Object.assign(
          new Error(`Renewal limit of ${issue.renewal_limit} reached`),
          { status: 409 }
        );
      }

      const newDue = new Date(issue.due_date);
      newDue.setDate(newDue.getDate() + issue.default_loan_days);

      const updated = await client.query(
        `UPDATE issues
         SET due_date = $1, renewal_count = renewal_count + 1, status = 'ISSUED', updated_at = NOW()
         WHERE issue_id = $2
         RETURNING due_date, renewal_count`,
        [newDue.toISOString().slice(0, 10), issueId]
      );

      return updated.rows[0];
    });

    res.json({ message: 'Book renewed', newDueDate: result.due_date, renewalCount: result.renewal_count });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to renew book' });
  }
};

module.exports = { issueBook, returnBook, getIssues, getOverdueIssues, renewBook };
