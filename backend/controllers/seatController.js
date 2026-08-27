const db = require('../config/db');
const { withTransaction } = require('../config/db');
const crypto = require('crypto');
const notificationService = require('../services/notificationService');

/**
 * GET /api/seats
 * Returns all active seats with current-day reservation status.
 */
const getSeats = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const slotStart = req.query.slotStart || null;
    const slotEnd   = req.query.slotEnd   || null;

    const result = await db.query(
      `SELECT s.seat_id, s.seat_label, s.zone,
              sr.status AS reservation_status,
              sr.seat_reservation_id,
              u.name AS reserved_by
       FROM seats s
       LEFT JOIN seat_reservations sr ON sr.seat_id = s.seat_id
         AND sr.date = $1
         AND ($2::TIME IS NULL OR sr.slot_start = $2::TIME)
         AND ($3::TIME IS NULL OR sr.slot_end   = $3::TIME)
         AND sr.status IN ('BOOKED','CHECKED_IN')
       LEFT JOIN students st ON st.student_id = sr.student_id
       LEFT JOIN users u    ON u.user_id      = st.user_id
       WHERE s.is_active = TRUE
       ORDER BY s.zone, s.seat_label`,
      [date, slotStart, slotEnd]
    );

    res.json({ seats: result.rows, date });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch seats' });
  }
};

/**
 * POST /api/seats/reserve
 * Body: { seatId, date, slotStart, slotEnd }
 */
const reserveSeat = async (req, res) => {
  const { seatId, date, slotStart, slotEnd } = req.body;
  if (!seatId || !date || !slotStart || !slotEnd) {
    return res.status(400).json({ error: 'seatId, date, slotStart, slotEnd are required' });
  }

  try {
    const studentResult = await db.query(
      `SELECT student_id FROM students WHERE user_id = $1`,
      [req.user.userId]
    );
    if (!studentResult.rows.length) return res.status(403).json({ error: 'Students only' });
    const studentId = studentResult.rows[0].student_id;

    const result = await withTransaction(async (client) => {
      // Check seat not already taken
      const existing = await client.query(
        `SELECT seat_reservation_id FROM seat_reservations
         WHERE seat_id = $1 AND date = $2 AND slot_start = $3::TIME AND status IN ('BOOKED','CHECKED_IN')
         FOR UPDATE`,
        [seatId, date, slotStart]
      );
      if (existing.rows.length) {
        throw Object.assign(new Error('Seat already reserved for that time slot'), { status: 409 });
      }

      // Generate a short-lived signed QR token
      const tokenBase = `${seatId}-${studentId}-${date}-${slotStart}-${Date.now()}`;
      const qrToken   = crypto.createHash('sha256').update(tokenBase).digest('hex').slice(0, 32);
      const tokenExpiry = new Date(`${date}T${slotEnd}`);

      const resResult = await client.query(
        `INSERT INTO seat_reservations (seat_id, student_id, date, slot_start, slot_end, qr_token, qr_token_expires_at)
         VALUES ($1, $2, $3, $4::TIME, $5::TIME, $6, $7)
         RETURNING seat_reservation_id, qr_token`,
        [seatId, studentId, date, slotStart, slotEnd, qrToken, tokenExpiry.toISOString()]
      );

      // Seat label
      const seatLabelResult = await client.query(`SELECT seat_label, zone FROM seats WHERE seat_id = $1`, [seatId]);

      return {
        reservation: resResult.rows[0],
        seatLabel:   seatLabelResult.rows[0]?.seat_label,
        zone:        seatLabelResult.rows[0]?.zone,
      };
    });

    await notificationService.createNotification({
      userId:  req.user.userId,
      type:    'SEAT',
      title:   'Seat Reserved',
      message: `Seat ${result.seatLabel} (${result.zone}) reserved on ${date} from ${slotStart} to ${slotEnd}. Show your QR pass at check-in.`,
      metadata: { seatReservationId: result.reservation.seat_reservation_id },
    });

    res.status(201).json({
      message:           'Seat reserved',
      seatReservationId: result.reservation.seat_reservation_id,
      qrToken:           result.reservation.qr_token,
      seatLabel:         result.seatLabel,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to reserve seat' });
  }
};

/**
 * POST /api/seats/checkin
 * Body: { token }  (QR scanner keyboard-emulation sends this)
 */
const checkIn = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'QR token is required' });

  try {
    const result = await db.query(
      `UPDATE seat_reservations
       SET status = 'CHECKED_IN', checked_in_at = NOW(), updated_at = NOW()
       WHERE qr_token = $1
         AND status = 'BOOKED'
         AND qr_token_expires_at > NOW()
       RETURNING seat_reservation_id, seat_id, student_id`,
      [token]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Invalid or expired QR token' });
    }

    const seatLabel = await db.query(`SELECT seat_label, zone FROM seats WHERE seat_id = $1`, [result.rows[0].seat_id]);
    res.json({
      message:   'Checked in successfully',
      seat:      seatLabel.rows[0]?.seat_label,
      zone:      seatLabel.rows[0]?.zone,
      checkedIn: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: 'Check-in failed' });
  }
};

/**
 * POST /api/seats/checkout
 * Body: { token }
 */
const checkOut = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'QR token is required' });

  try {
    const result = await db.query(
      `UPDATE seat_reservations
       SET status = 'COMPLETED', checked_out_at = NOW(), updated_at = NOW()
       WHERE qr_token = $1 AND status = 'CHECKED_IN'
       RETURNING seat_reservation_id`,
      [token]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Active check-in not found for this token' });
    res.json({ message: 'Checked out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Check-out failed' });
  }
};

module.exports = { getSeats, reserveSeat, checkIn, checkOut };
