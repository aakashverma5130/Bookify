const db = require('../config/db');

/**
 * POST /api/audit/scan
 * Librarian scans a copy during inventory audit.
 * Body: { qrCodeValue or accessionNumber, expectedShelf? }
 */
const scanCopy = async (req, res) => {
  const { qrCodeValue, accessionNumber, expectedShelf, notes } = req.body;
  if (!qrCodeValue && !accessionNumber) {
    return res.status(400).json({ error: 'qrCodeValue or accessionNumber is required' });
  }

  try {
    // Look up copy
    const copyResult = await db.query(
      `SELECT bc.copy_id, bc.book_id, bc.status, bc.accession_number,
              bc.shelf_block, bc.shelf_rack, bc.shelf_shelf,
              b.title AS book_title
       FROM book_copies bc
       JOIN books b ON b.book_id = bc.book_id
       WHERE bc.qr_code_value = $1 OR bc.accession_number = $2`,
      [qrCodeValue || null, accessionNumber || null]
    );

    if (!copyResult.rows.length) {
      return res.status(404).json({ error: 'Copy not found in system — may be unregistered' });
    }

    const copy = copyResult.rows[0];
    const expectedShelfStr = expectedShelf || `${copy.shelf_block}/${copy.shelf_rack}/${copy.shelf_shelf}`;
    const actualShelf = `${copy.shelf_block}/${copy.shelf_rack}/${copy.shelf_shelf}`;

    // Determine result
    let result;
    if (copy.status === 'ISSUED') {
      // Copy is legitimately out — this is fine, log it
      result = 'VERIFIED';
    } else if (expectedShelf && expectedShelf !== actualShelf) {
      result = 'MISPLACED';
    } else {
      result = 'VERIFIED';
    }

    // Log the audit
    const auditResult = await db.query(
      `INSERT INTO inventory_audit_log (copy_id, scanned_by, result, expected_shelf, suggested_shelf, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING audit_id`,
      [copy.copy_id, req.user.userId, result, expectedShelfStr, actualShelf, notes || null]
    );

    res.json({
      auditId:       auditResult.rows[0].audit_id,
      copyId:        copy.copy_id,
      accessionNo:   copy.accession_number,
      bookTitle:     copy.book_title,
      status:        copy.status,
      result,
      currentShelf:  actualShelf,
      expectedShelf: expectedShelfStr,
    });
  } catch (err) {
    res.status(500).json({ error: 'Scan failed' });
  }
};

/**
 * GET /api/audit/report
 * Summary of the latest audit session.
 */
const getAuditReport = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT ail.audit_id, ail.result, ail.scan_date, ail.expected_shelf, ail.suggested_shelf, ail.notes,
              bc.accession_number, bc.status AS copy_status,
              b.title AS book_title, b.book_id,
              u.name AS scanned_by_name
       FROM inventory_audit_log ail
       JOIN book_copies bc ON bc.copy_id  = ail.copy_id
       JOIN books b        ON b.book_id   = bc.book_id
       JOIN users u        ON u.user_id   = ail.scanned_by
       ORDER BY ail.scan_date DESC
       LIMIT 500`
    );

    const summary = {
      verified:  result.rows.filter(r => r.result === 'VERIFIED').length,
      missing:   result.rows.filter(r => r.result === 'MISSING').length,
      misplaced: result.rows.filter(r => r.result === 'MISPLACED').length,
    };

    res.json({ summary, entries: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit report' });
  }
};

module.exports = { scanCopy, getAuditReport };
