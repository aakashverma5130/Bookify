const db = require('../config/db');
const fineService = require('../services/fineService');

/**
 * GET /api/student/profile
 */
const getProfile = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.user_id, u.name, u.email, u.phone, u.profile_image, u.notify_email, u.notify_web_push,
              s.student_id, s.enrollment_no, s.department, s.course, s.year, s.semester, s.created_at
       FROM users u
       JOIN students s ON s.user_id = u.user_id
       WHERE u.user_id = $1`,
      [req.user.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Profile not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

/**
 * GET /api/student/books
 * Currently issued and reserved books.
 */
const getCurrentBooks = async (req, res) => {
  try {
    const studentResult = await db.query(
      `SELECT student_id FROM students WHERE user_id = $1`,
      [req.user.userId]
    );
    if (!studentResult.rows.length) return res.status(403).json({ error: 'Student not found' });
    const studentId = studentResult.rows[0].student_id;

    const result = await db.query(
      `SELECT * FROM v_student_books WHERE student_id = $1 AND status IN ('ISSUED','OVERDUE') ORDER BY due_date ASC`,
      [studentId]
    );

    res.json({ books: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch books' });
  }
};

/**
 * GET /api/student/history
 */
const getBorrowingHistory = async (req, res) => {
  try {
    const studentResult = await db.query(
      `SELECT student_id FROM students WHERE user_id = $1`,
      [req.user.userId]
    );
    const studentId = studentResult.rows[0]?.student_id;

    const result = await db.query(
      `SELECT * FROM v_student_books WHERE student_id = $1 ORDER BY issue_date DESC LIMIT 100`,
      [studentId]
    );

    res.json({ history: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

/**
 * GET /api/student/fines
 */
const getFines = async (req, res) => {
  try {
    const studentResult = await db.query(
      `SELECT student_id FROM students WHERE user_id = $1`,
      [req.user.userId]
    );
    const studentId = studentResult.rows[0]?.student_id;

    const result = await db.query(
      `SELECT f.fine_id, f.amount, f.reason, f.paid, f.created_at, f.paid_at, f.notes,
              b.title AS book_title, bc.accession_number
       FROM fines f
       JOIN issues i     ON i.issue_id  = f.issue_id
       JOIN book_copies bc ON bc.copy_id = i.copy_id
       JOIN books b      ON b.book_id   = bc.book_id
       WHERE f.student_id = $1
       ORDER BY f.created_at DESC`,
      [studentId]
    );

    const total = result.rows.reduce((sum, f) => sum + (f.paid ? 0 : parseFloat(f.amount)), 0);
    res.json({ fines: result.rows, totalUnpaid: total.toFixed(2) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch fines' });
  }
};

/**
 * GET /api/student/dashboard
 * Single endpoint for all dashboard stat cards.
 */
const getDashboard = async (req, res) => {
  try {
    const studentResult = await db.query(
      `SELECT student_id FROM students WHERE user_id = $1`,
      [req.user.userId]
    );
    const studentId = studentResult.rows[0]?.student_id;

    const [booksResult, finesResult, reservationsResult] = await Promise.all([
      db.query(
        `SELECT
           COUNT(*) FILTER (WHERE status IN ('ISSUED','OVERDUE')) AS currently_borrowed,
           COUNT(*) FILTER (WHERE status IN ('ISSUED','OVERDUE') AND due_date - CURRENT_DATE <= 3) AS due_soon,
           COUNT(*) FILTER (WHERE status = 'OVERDUE' OR (status = 'ISSUED' AND due_date < CURRENT_DATE)) AS overdue
         FROM issues WHERE student_id = $1`,
        [studentId]
      ),
      db.query(
        `SELECT COALESCE(SUM(amount),0) AS total_fines FROM fines WHERE student_id = $1 AND paid = FALSE`,
        [studentId]
      ),
      db.query(
        `SELECT COUNT(*) AS active_reservations FROM book_reservations
         WHERE student_id = $1 AND status IN ('WAITING','NOTIFIED')`,
        [studentId]
      ),
    ]);

    res.json({
      currentlyBorrowed:  parseInt(booksResult.rows[0].currently_borrowed),
      dueSoon:            parseInt(booksResult.rows[0].due_soon),
      overdue:            parseInt(booksResult.rows[0].overdue),
      totalUnpaidFines:   parseFloat(finesResult.rows[0].total_fines).toFixed(2),
      activeReservations: parseInt(reservationsResult.rows[0].active_reservations),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
};

module.exports = { getProfile, getCurrentBooks, getBorrowingHistory, getFines, getDashboard };
