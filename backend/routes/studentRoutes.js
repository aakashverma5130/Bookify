const express = require('express');
const router = express.Router();
const c = require('../controllers/studentController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole, STUDENT_ONLY } = require('../middleware/roleMiddleware');

router.get('/profile',    authenticate, requireRole(...STUDENT_ONLY), c.getProfile);
router.get('/books',      authenticate, requireRole(...STUDENT_ONLY), c.getCurrentBooks);
router.get('/history',    authenticate, requireRole(...STUDENT_ONLY), c.getBorrowingHistory);
router.get('/fines',      authenticate, requireRole(...STUDENT_ONLY), c.getFines);
router.get('/dashboard',  authenticate, requireRole(...STUDENT_ONLY), c.getDashboard);

module.exports = router;
