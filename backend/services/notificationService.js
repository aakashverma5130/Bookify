const nodemailer = require('nodemailer');
const webpush = require('web-push');
const db = require('../config/db');
const log = require('../logger');

// ── Nodemailer transporter ────────────────────────────────────────────────────
let transporter;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    // Real SMTP (production)
    transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    log.info('email_smtp_configured', { host: process.env.SMTP_HOST });
  } else {
    // Ethereal (local dev) — captures emails in a browser UI
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    log.info('email_ethereal_configured', { host: 'smtp.ethereal.email' });
  }

  return transporter;
};

// ── Web Push setup ────────────────────────────────────────────────────────────
// M-9: validate the VAPID configuration at startup. If `notify_web_push`
// is enabled for any user, the push subscription flow expects the VAPID
// keys to be present. We catch this early so a missing key surfaces
// at boot time, not at the first push attempt.
if (process.env.VAPID_PUBLIC_KEY || process.env.VAPID_PRIVATE_KEY) {
  // If one key is set, the other must be too.
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    log.error('push_vapid_keys_partial', { remediation: 'npx web-push generate-vapid-keys' });
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  } else if (
    process.env.VAPID_PUBLIC_KEY.length < 20 ||
    process.env.VAPID_PRIVATE_KEY.length < 20
  ) {
    log.error('push_vapid_keys_too_short', { remediation: 'npx web-push generate-vapid-keys' });
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  } else {
    try {
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:admin@bookify.edu',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
      log.info('push_vapid_configured');
    } catch (err) {
      log.error('push_vapid_configure_failed', { message: err.message });
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  }
} else if (process.env.NODE_ENV === 'production') {
  // M-9: in production, VAPID keys are required for web-push to work.
  // Log a warning but don't fail — operators may not use web push yet.
  log.warn('push_vapid_not_configured');
}

/**
 * Create an in-app notification and optionally send email/push.
 *
 * @param {object} params
 * @param {string} params.userId   - UUID of the recipient (users.user_id)
 * @param {string} params.type     - notification type constant
 * @param {string} params.title
 * @param {string} params.message
 * @param {object} [params.metadata] - extra JSON data
 * @param {object} [params.client]   - pg client (for transaction use)
 */
const createNotification = async ({ userId, type, title, message, metadata, client }) => {
  const q = client ? client.query.bind(client) : db.query;

  // 1. Insert in-app notification
  const notifResult = await q(
    `INSERT INTO notifications (user_id, title, message, type, channel, metadata)
     VALUES ($1, $2, $3, $4, 'IN_APP', $5)
     RETURNING *`,
    [userId, title, message, type, metadata ? JSON.stringify(metadata) : null]
  );

  // 2. Fetch user's notification preferences
  const userResult = await q(
    `SELECT email, notify_email, notify_web_push FROM users WHERE user_id = $1`,
    [userId]
  );

  if (!userResult.rows.length) return notifResult.rows[0];

  const { email, notify_email, notify_web_push } = userResult.rows[0];

  // 3. Send email if opted in
  if (notify_email && email) {
    sendEmail({ to: email, subject: title, text: message }).catch(err =>
      log.error('email_send_failed', { message: err.message, to: email })
    );
  }

  // 4. Send web push if opted in (subscription stored separately — simplified here)
  if (notify_web_push) {
    // M-9: VAPID must be configured before we can push. Otherwise we
    // silently log instead of crashing the notification flow.
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      log.warn('push_skipped_no_vapid', { userId, title });
    } else {
      // In a full implementation, fetch the push subscription from a
      // subscriptions table and call `webpush.sendNotification(...)`.
      log.info('push_simulated', { userId, title });
    }
  }

  return notifResult.rows[0];
};

/**
 * Send a plain-text email.
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const t = await getTransporter();
  const info = await t.sendMail({
    from: process.env.EMAIL_FROM || '"Bookify Library" <noreply@bookify.edu>',
    to,
    subject,
    text,
    html: html || `<p>${text}</p>`,
  });
  // In dev with Ethereal, log the preview URL
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    log.info('email_ethereal_preview', { url: previewUrl });
  }
  return info;
};

module.exports = { createNotification, sendEmail };
