const db = require('../config/db');

/**
 * Calculate the fine for an issue.
 * Pulls fine_per_day from library_settings — never hard-codes the rate.
 *
 * @param {string} issueId - UUID of the issue row
 * @param {object} [client] - Optional pg client (for use inside a transaction)
 * @returns {Promise<{ amount: number, overdueDays: number, finePerDay: number }>}
 */
const calculateFine = async (issueId, client) => {
  const q = client ? client.query.bind(client) : db.query;

  // Get issue + settings in one query
  const result = await q(
    `SELECT
       i.due_date,
       i.return_date,
       i.status,
       s.fine_per_day
     FROM issues i
     CROSS JOIN library_settings s
     WHERE i.issue_id = $1
     LIMIT 1`,
    [issueId]
  );

  if (!result.rows.length) {
    throw new Error(`Issue not found: ${issueId}`);
  }

  const { due_date, return_date, status, fine_per_day } = result.rows[0];
  const referenceDate = return_date ? new Date(return_date) : new Date();
  const dueDate = new Date(due_date);

  // Number of calendar days past due (0 if returned on time)
  const msPerDay = 24 * 60 * 60 * 1000;
  const overdueDays = Math.max(0, Math.floor((referenceDate - dueDate) / msPerDay));
  const amount = parseFloat((overdueDays * parseFloat(fine_per_day)).toFixed(2));

  return { amount, overdueDays, finePerDay: parseFloat(fine_per_day) };
};

/**
 * Create a fine row in the database.
 * Called by circulationController on return.
 *
 * @param {object} params
 * @param {string} params.issueId
 * @param {string} params.studentId
 * @param {number} params.amount
 * @param {string} params.reason   - 'OVERDUE' | 'DAMAGE' | 'LOST'
 * @param {string} [params.notes]
 * @param {object} [params.client] - pg client for transaction
 */
const createFine = async ({ issueId, studentId, amount, reason, notes, client }) => {
  const q = client ? client.query.bind(client) : db.query;
  const result = await q(
    `INSERT INTO fines (issue_id, student_id, amount, reason, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [issueId, studentId, amount, reason, notes || null]
  );
  return result.rows[0];
};

/**
 * Get total unpaid fines for a student.
 * @param {string} studentId
 */
const getUnpaidFines = async (studentId) => {
  const result = await db.query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM fines
     WHERE student_id = $1 AND paid = FALSE`,
    [studentId]
  );
  return parseFloat(result.rows[0].total);
};

module.exports = { calculateFine, createFine, getUnpaidFines };
