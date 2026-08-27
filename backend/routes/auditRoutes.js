const express = require('express');
const router = express.Router();
const c = require('../controllers/auditController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole, LIBRARIAN_ROLES } = require('../middleware/roleMiddleware');

router.post('/scan',    authenticate, requireRole(...LIBRARIAN_ROLES), c.scanCopy);
router.get('/report',   authenticate, requireRole(...LIBRARIAN_ROLES), c.getAuditReport);

module.exports = router;
