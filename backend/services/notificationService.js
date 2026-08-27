const nodemailer = require('nodemailer');
const webpush = require('web-push');
const db = require('../config/db');

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
    console.log('[EMAIL] Using configured SMTP server');
  } else {
    // Ethereal (local dev) — captures emails in a browser UI
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log('[EMAIL] Using Ethereal SMTP — preview emails at https://ethereal.email');
  }

  return transporter;
};

// ── Web Push setup ────────────────────────────────────────────────────────────
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@booksphere.edu',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
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
      console.error('[EMAIL] Failed to send notification email:', err.message)
    );
  }

  // 4. Send web push if opted in (subscription stored separately — simplified here)
  if (notify_web_push) {
    // In a full implementation, fetch the push subscription from a subscriptions table.
    // For now, log that push would be sent.
    console.log(`[PUSH] Would send push notification to user ${userId}: ${title}`);
  }

  return notifResult.rows[0];
};

/**
 * Send a plain-text email.
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const t = await getTransporter();
  const info = await t.sendMail({
    from: process.env.EMAIL_FROM || '"Booksphere Library" <noreply@booksphere.edu>',
    to,
    subject,
    text,
    html: html || `<p>${text}</p>`,
  });
  // In dev with Ethereal, log the preview URL
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[EMAIL] Preview: ${previewUrl}`);
  }
  return info;
};

module.exports = { createNotification, sendEmail };
