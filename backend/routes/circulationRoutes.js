const express = require('express');
const router = express.Router();
const c = require('../controllers/circulationController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole, LIBRARIAN_ROLES } = require('../middleware/roleMiddleware');

router.post('/',                authenticate, requireRole(...LIBRARIAN_ROLES), c.issueBook);
router.put('/:id/return',       authenticate, requireRole(...LIBRARIAN_ROLES), c.returnBook);
router.put('/:id/renew',        authenticate,                                  c.renewBook);
router.get('/',                 authenticate, requireRole(...LIBRARIAN_ROLES), c.getIssues);
router.get('/overdue',          authenticate, requireRole(...LIBRARIAN_ROLES), c.getOverdueIssues);

module.exports = router;
