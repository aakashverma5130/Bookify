const db = require('../config/db');
const aiClient = require('../services/aiClient');
const { invalidateTokenCache } = require('../middleware/authMiddleware');
const log = require('../logger');

/**
 * GET /api/admin/dashboard
 * Overview stats for the librarian dashboard.
 */
const getDashboard = async (req, res) => {
  try {
    const [books, issues, fines, students] = await Promise.all([
      db.query(`SELECT total_copies, available_copies FROM books`),
      db.query(`SELECT status, COUNT(*) AS count FROM issues GROUP BY status`),
      db.query(`SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) FILTER (WHERE paid=FALSE) AS unpaid_count FROM fines`),
      db.query(`SELECT COUNT(*) AS total FROM students`),
    ]);

    const totalCopies     = books.rows.reduce((s, b) => s + parseInt(b.total_copies), 0);
    const availableCopies = books.rows.reduce((s, b) => s + parseInt(b.available_copies), 0);

    const issuesByStatus = Object.fromEntries(issues.rows.map(r => [r.status, parseInt(r.count)]));

    // Copies not with AVAILABLE or ISSUED — damaged/lost
    const damagedLostResult = await db.query(
      `SELECT COUNT(*) AS count FROM book_copies WHERE status IN ('DAMAGED','LOST')`
    );

    res.json({
      totalCopies,
      availableCopies,
      issuedCopies:     issuesByStatus.ISSUED  || 0,
      overdueIssues:    issuesByStatus.OVERDUE || 0,
      totalStudents:    parseInt(students.rows[0].total),
      totalFinesRs:     parseFloat(fines.rows[0].total).toFixed(2),
      unpaidFinesCount: parseInt(fines.rows[0].unpaid_count),
      damagedLostCopies: parseInt(damagedLostResult.rows[0].count),
    });
  } catch (err) {
    log.error('analytics_dashboard_failed', { message: err.message });
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
};

/**
 * GET /api/admin/reports
 * Monthly issue trends, top borrowed books.
 */
const getReports = async (req, res) => {
  try {
    const [monthlyTrend, topBooks, categoryBreakdown] = await Promise.all([
      db.query(
        `SELECT DATE_TRUNC('month', issue_date) AS month, COUNT(*) AS issues
         FROM issues
         WHERE issue_date >= NOW() - INTERVAL '12 months'
         GROUP BY 1 ORDER BY 1`
      ),
      db.query(
        `SELECT b.book_id, b.title, b.cover_image_url, a.name AS author_name, COUNT(i.issue_id) AS borrow_count
         FROM issues i
         JOIN book_copies bc ON bc.copy_id = i.copy_id
         JOIN books b        ON b.book_id  = bc.book_id
         LEFT JOIN authors a ON a.author_id = b.author_id
         WHERE i.issue_date >= NOW() - INTERVAL '90 days'
         GROUP BY b.book_id, b.title, b.cover_image_url, a.name
         ORDER BY borrow_count DESC LIMIT 10`
      ),
      db.query(
        `SELECT c.name AS category, COUNT(i.issue_id) AS borrow_count
         FROM issues i
         JOIN book_copies bc ON bc.copy_id  = i.copy_id
         JOIN books b        ON b.book_id   = bc.book_id
         JOIN categories c   ON c.category_id = b.category_id
         GROUP BY c.name ORDER BY borrow_count DESC`
      ),
    ]);

    res.json({
      monthlyTrend:      monthlyTrend.rows,
      topBooks:          topBooks.rows,
      categoryBreakdown: categoryBreakdown.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

/**
 * GET /api/admin/demand-forecast
 * Returns cached forecasts from demand_forecasts table.
 * Also triggers an AI refresh if forecasts are older than 24h.
 */
const getDemandForecast = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT df.forecast_id, df.book_id, df.predicted_demand_score, df.priority, df.reasoning, df.generated_at,
              b.title, b.cover_image_url,
              a.name AS author_name,
              c.name AS category_name
       FROM demand_forecasts df
       JOIN books b        ON b.book_id    = df.book_id
       LEFT JOIN authors a ON a.author_id  = b.author_id
       LEFT JOIN categories c ON c.category_id = b.category_id
       ORDER BY df.predicted_demand_score DESC`
    );

    // Trigger async refresh if data is stale (> 24h)
    if (result.rows.length === 0 || new Date() - new Date(result.rows[0]?.generated_at) > 24 * 60 * 60 * 1000) {
      aiClient.triggerDemandForecast().catch(() => {});
    }

    res.json({ forecasts: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch demand forecast' });
  }
};

/**
 * GET /api/admin/students
 */
const getStudents = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const offset = (pageNum - 1) * limitNum;

    const params = [];
    let where = '';

    if (search) {
      params.push(`%${search}%`);
      where = `WHERE (u.name ILIKE $1 OR u.email ILIKE $1 OR s.enrollment_no ILIKE $1)`;
    }

    params.push(limitNum, offset);

    const result = await db.query(
      `SELECT s.student_id, u.name, u.email, u.phone, u.is_active,
              s.enrollment_no, s.department, s.course, s.year, s.semester,
              COUNT(DISTINCT i.issue_id) FILTER (WHERE i.status IN ('ISSUED','OVERDUE')) AS active_issues,
              COALESCE(SUM(f.amount) FILTER (WHERE f.paid = FALSE), 0) AS unpaid_fines
       FROM students s
       JOIN users u ON u.user_id = s.user_id
       LEFT JOIN issues i ON i.student_id = s.student_id
       LEFT JOIN fines f  ON f.student_id = s.student_id
       ${where}
       GROUP BY s.student_id, u.name, u.email, u.phone, u.is_active, s.enrollment_no, s.department, s.course, s.year, s.semester
       ORDER BY u.name
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ students: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

/**
 * PUT /api/admin/students/:id/suspend
 * HEAD_LIBRARIAN only
 */
const suspendStudent = async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE users SET is_active = FALSE, updated_at = NOW()
       WHERE user_id = (SELECT user_id FROM students WHERE student_id = $1)
       RETURNING user_id`,
      [req.params.id]
    );
    // L-3: invalidate the auth cache so the suspended user's existing
    // token is rejected on the next request (within the cache TTL).
    if (result.rows.length) {
      invalidateTokenCache(result.rows[0].user_id);
    }
    res.json({ message: 'Student suspended' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to suspend student' });
  }
};

/**
 * PUT /api/admin/students/:id/activate
 */
const activateStudent = async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE users SET is_active = TRUE, updated_at = NOW()
       WHERE user_id = (SELECT user_id FROM students WHERE student_id = $1)
       RETURNING user_id`,
      [req.params.id]
    );
    if (result.rows.length) {
      invalidateTokenCache(result.rows[0].user_id);
    }
    res.json({ message: 'Student activated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to activate student' });
  }
};

/**
 * GET /api/admin/settings
 */
const getSettings = async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM library_settings LIMIT 1`);
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

/**
 * PUT /api/admin/settings
 * HEAD_LIBRARIAN only
 */
const updateSettings = async (req, res) => {
  const { finePerDay, maxBooksPerStudent, defaultLoanDays, renewalLimit, seatGraceMinutes } = req.body;
  try {
    await db.query(
      `UPDATE library_settings
       SET fine_per_day=$1, max_books_per_student=$2, default_loan_days=$3, renewal_limit=$4,
           seat_grace_minutes=$5, updated_at=NOW(), updated_by=$6`,
      [finePerDay, maxBooksPerStudent, defaultLoanDays, renewalLimit, seatGraceMinutes, req.user.userId]
    );
    res.json({ message: 'Settings updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

module.exports = { getDashboard, getReports, getDemandForecast, getStudents, suspendStudent, activateStudent, getSettings, updateSettings };
