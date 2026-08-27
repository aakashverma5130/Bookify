// Stub controllers referenced in server.js but implemented elsewhere
const db = require('../config/db');

const getPurchaseRequests = async (req, res) => {
  try {
    const isLibrarian = req.user.role !== 'STUDENT';
    let where = '';
    const params = [];
    if (!isLibrarian) {
      const s = await db.query(`SELECT student_id FROM students WHERE user_id=$1`, [req.user.userId]);
      params.push(s.rows[0]?.student_id);
      where = `WHERE pr.student_id = $1`;
    }
    const result = await db.query(
      `SELECT pr.*, u.name AS student_name, s.enrollment_no
       FROM purchase_requests pr
       JOIN students s ON s.student_id = pr.student_id
       JOIN users u    ON u.user_id    = s.user_id
       ${where}
       ORDER BY pr.created_at DESC`,
      params
    );
    res.json({ requests: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch purchase requests' });
  }
};

const createPurchaseRequest = async (req, res) => {
  const { title, author, isbn, reason } = req.body;
  if (!title || !reason) return res.status(400).json({ error: 'title and reason are required' });
  try {
    const s = await db.query(`SELECT student_id FROM students WHERE user_id=$1`, [req.user.userId]);
    const studentId = s.rows[0]?.student_id;
    if (!studentId) return res.status(403).json({ error: 'Students only' });
    const result = await db.query(
      `INSERT INTO purchase_requests (student_id, title, author, isbn, reason) VALUES($1,$2,$3,$4,$5) RETURNING request_id`,
      [studentId, title, author || null, isbn || null, reason]
    );
    res.status(201).json({ requestId: result.rows[0].request_id, message: 'Purchase request submitted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit request' });
  }
};

const decideOnRequest = async (req, res) => {
  const { status, librarianNotes } = req.body;
  if (!['APPROVED','REJECTED'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    await db.query(
      `UPDATE purchase_requests SET status=$1, librarian_notes=$2, reviewed_by=$3, reviewed_at=NOW() WHERE request_id=$4`,
      [status, librarianNotes || null, req.user.userId, req.params.id]
    );
    res.json({ message: `Request ${status.toLowerCase()}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update request' });
  }
};

module.exports = { getPurchaseRequests, createPurchaseRequest, decideOnRequest };
