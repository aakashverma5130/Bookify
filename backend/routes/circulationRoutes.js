const express = require('express');
const router = express.Router();
const c = require('../controllers/circulationController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole, LIBRARIAN_ROLES } = require('../middleware/roleMiddleware');
const {
  issueBookValidation,
  returnBookValidation,
  renewBookValidation,
  paginationValidation,
  uuidParam,
} = require('../middleware/validation');

router.post('/',                authenticate, requireRole(...LIBRARIAN_ROLES), issueBookValidation,   c.issueBook);
router.put('/:id/return',       authenticate, requireRole(...LIBRARIAN_ROLES), returnBookValidation,  c.returnBook);
router.put('/:id/renew',        authenticate, requireRole(...LIBRARIAN_ROLES), renewBookValidation,   c.renewBook);
router.get('/',                 authenticate, requireRole(...LIBRARIAN_ROLES), paginationValidation,   c.getIssues);
router.get('/overdue',          authenticate, requireRole(...LIBRARIAN_ROLES),                          c.getOverdueIssues);

module.exports = router;
