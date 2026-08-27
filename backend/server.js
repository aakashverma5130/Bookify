require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cron = require('node-cron');

const db = require('./config/db');
const { dailyReminderJob } = require('./jobs/dailyReminderJob');
const { reservationExpiryJob } = require('./jobs/reservationExpiryJob');

// ── Route imports ─────────────────────────────────────────────────────────────
const authRoutes                = require('./routes/authRoutes');
const bookRoutes                = require('./routes/bookRoutes');
const circulationRoutes         = require('./routes/circulationRoutes');
const reservationRoutes         = require('./routes/reservationRoutes');
const digitalResourceRoutes     = require('./routes/digitalResourceRoutes');
const purchaseRequestRoutes     = require('./routes/purchaseRequestRoutes');
const analyticsRoutes           = require('./routes/analyticsRoutes');
const auditRoutes               = require('./routes/auditRoutes');
const adminRoutes               = require('./routes/adminRoutes');
const notificationRoutes        = require('./routes/notificationRoutes');
const studentRoutes             = require('./routes/studentRoutes');

const app = express();

// ── Security middleware ───────────────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman) or matched origins
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests, please try again later.' },
});

app.use(globalLimiter);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static uploads (local dev only) ──────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', service: 'bookify-backend', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// ── API routes ────────────────────────────────────────────────────────────────
// NOTE: the authLimiter is attached only to the credential-checking routes
// (login, forgot-password, verify-otp) inside routes/authRoutes.js, so that
// legitimate users are not locked out for hitting getMe / logout / reset
// password on a busy session.
app.use('/api/auth',              authRoutes);
app.use('/api/books',             bookRoutes);
app.use('/api/issues',            circulationRoutes);
app.use('/api/reservations',      reservationRoutes);
app.use('/api/digital-resources', digitalResourceRoutes);
app.use('/api/purchase-requests', purchaseRequestRoutes);
app.use('/api/admin',             analyticsRoutes);
app.use('/api/audit',             auditRoutes);
app.use('/api/admin',             adminRoutes);
app.use('/api/notifications',     notificationRoutes);
app.use('/api/student',           studentRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : err.message;
  console.error(`[ERROR] ${err.stack || err.message}`);
  res.status(status).json({ error: message });
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 5000;

async function start() {
  // Verify DB connectivity before accepting traffic
  try {
    await db.query('SELECT 1');
    console.log('[DB] Database ready and operational');
  } catch (err) {
    console.error('[DB] Database initialization error:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`[SERVER] Bookify backend running on port ${PORT}`);
    console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // ── Schedule daily reminder job ───────────────────────────────────────────
  const cronSchedule = process.env.REMINDER_CRON || '0 8 * * *';
  cron.schedule(cronSchedule, () => {
    console.log('[CRON] Running daily reminder job...');
    dailyReminderJob().catch(err =>
      console.error('[CRON] Daily reminder job failed:', err.message)
    );
  });
  console.log(`[CRON] Daily reminder job scheduled: ${cronSchedule}`);

  // ── Schedule reservation expiry job ─────────────────────────────────────
  // Enforces the 24-hour pickup window. Runs every 5 minutes so that
  // holds are released and the queue is re-promoted promptly after expiry.
  const reservationCron = process.env.RESERVATION_EXPIRY_CRON || '*/5 * * * *';
  cron.schedule(reservationCron, () => {
    console.log('[CRON] Running reservation expiry sweep...');
    reservationExpiryJob().catch(err =>
      console.error('[CRON] Reservation expiry job failed:', err.message)
    );
  });
  console.log(`[CRON] Reservation expiry job scheduled: ${reservationCron}`);
}

start();

module.exports = app; // for testing
