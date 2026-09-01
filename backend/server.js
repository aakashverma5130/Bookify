require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cron = require('node-cron');

// ── Startup secret validation (H-1) ────────────────────────────────────────────
const log = require('./logger');
const DEFAULT_SECRETS = new Set([
  'change-this-to-a-long-random-secret-in-production',
  'replace_with_a_long_random_secret_string',
  'secret',
  'your-secret-key',
  '',
]);
if (!process.env.JWT_SECRET || DEFAULT_SECRETS.has(process.env.JWT_SECRET)) {
  log.error('security_jwt_secret_missing', {
    remediation: 'Generate a strong secret with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"',
  });
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  log.error('security_jwt_secret_too_short', { length: process.env.JWT_SECRET.length, minLength: 32 });
  process.exit(1);
}

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

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    // Only allow requests with an explicit Origin that matches the allow-list.
    // We no longer permit `!origin` (server-to-server, curl, file:// pages, etc.)
    // to bypass the check — that branch was a CSRF / data-exfiltration risk.
    if (origin && allowedOrigins.includes(origin)) return cb(null, true);
    const err = new Error(`CORS blocked: ${origin || '(no origin)'}`);
    err.status = 403;
    cb(err);
  },
  credentials: true,
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders:   false,
  skipSuccessfulRequests: true,   // only failed (4xx/5xx) requests count toward the limit
  message: { error: 'Too many requests, please try again later.' },
});

app.use(globalLimiter);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static uploads (REMOVED — H-6) ───────────────────────────────────────────
// We no longer serve `/uploads` as a public static directory. All file
// downloads now flow through the authenticated `digitalResourceController`
// which enforces course-restriction and download tracking.
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
  const isProduction = process.env.NODE_ENV === 'production';
  const message = isProduction
    ? 'An unexpected error occurred'
    : err.message;

  // M-2 / L-1: never echo the full stack trace in responses. Log it
  // server-side (where it belongs) and only return a sanitized message.
  // Verbose logging stays on the server, not in the response body.
  if (isProduction) {
    // Server-side log only includes the error class + first line of message
    // to avoid leaking file paths or query text to log aggregators.
    log.error('request_error', { name: err.name, message: String(err.message).split('\n')[0], status });
  } else {
    log.error('request_error', { stack: err.stack, message: err.message, status });
  }
  res.status(status).json({ error: message });
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 5000;

async function start() {
  // Verify DB connectivity before accepting traffic
  try {
    await db.query('SELECT 1');
    log.info('database_ready');
  } catch (err) {
    log.error('database_init_failed', { message: err.message });
  }

  app.listen(PORT, () => {
    log.info('server_started', { port: PORT, env: process.env.NODE_ENV || 'development' });
  });

  // ── Schedule daily reminder job ───────────────────────────────────────────
  const cronSchedule = process.env.REMINDER_CRON || '0 8 * * *';
  cron.schedule(cronSchedule, () => {
    log.info('cron_reminder_running');
    dailyReminderJob().catch(err =>
      log.error('cron_reminder_failed', { message: err.message })
    );
  });
  log.info('cron_reminder_scheduled', { schedule: cronSchedule });

  // ── Schedule reservation expiry job ─────────────────────────────────────
  // Enforces the 24-hour pickup window. Runs every 5 minutes so that
  // holds are released and the queue is re-promoted promptly after expiry.
  const reservationCron = process.env.RESERVATION_EXPIRY_CRON || '*/5 * * * *';
  cron.schedule(reservationCron, () => {
    log.info('cron_reservation_sweep_running');
    reservationExpiryJob().catch(err =>
      log.error('cron_reservation_sweep_failed', { message: err.message })
    );
  });
  log.info('cron_reservation_sweep_scheduled', { schedule: reservationCron });
}

start();

module.exports = app; // for testing
