const express = require('express');
const router = express.Router();
const c = require('../controllers/reservationController');
const { authenticate } = require('../middleware/authMiddleware');
const { reservationValidation, uuidParam } = require('../middleware/validation');

router.post('/',         authenticate, reservationValidation, c.createReservation);
router.delete('/:id',   authenticate, uuidParam(), c.cancelReservation);
router.get('/',         authenticate, c.getReservations);

module.exports = router;
