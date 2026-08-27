const express = require('express');
const router = express.Router();
const c = require('../controllers/seatController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/',            authenticate, c.getSeats);
router.post('/reserve',    authenticate, c.reserveSeat);
router.post('/checkin',    authenticate, c.checkIn);
router.post('/checkout',   authenticate, c.checkOut);

module.exports = router;
