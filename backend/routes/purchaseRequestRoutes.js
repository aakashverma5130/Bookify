const express = require('express');
const router = express.Router();
const c = require('../controllers/purchaseRequestController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole, LIBRARIAN_ROLES, STUDENT_ONLY } = require('../middleware/roleMiddleware');

router.post('/',                authenticate, requireRole(...STUDENT_ONLY),    c.createPurchaseRequest);
router.get('/',                 authenticate,                                   c.getPurchaseRequests);
router.put('/:id/decision',     authenticate, requireRole(...LIBRARIAN_ROLES), c.decideOnRequest);

module.exports = router;
