const express = require('express');
const router = express.Router();
const c = require('../controllers/reservationController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/',         authenticate, c.createReservation);
router.delete('/:id',   authenticate, c.cancelReservation);
router.get('/',         authenticate, c.getReservations);

module.exports = router;
