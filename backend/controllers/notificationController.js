const db = require('../config/db');
const notificationService = require('../services/notificationService');

const getNotifications = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT notification_id, title, message, type, channel, is_read, metadata, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.userId]
    );
    res.json({ notifications: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

const markRead = async (req, res) => {
  try {
    await db.query(
      `UPDATE notifications SET is_read = TRUE WHERE notification_id = $1 AND user_id = $2`,
      [req.params.id, req.user.userId]
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

const markAllRead = async (req, res) => {
  try {
    await db.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1`,
      [req.user.userId]
    );
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
};

const updateNotificationSettings = async (req, res) => {
  const { notifyEmail, notifyWebPush } = req.body;
  try {
    await db.query(
      `UPDATE users SET notify_email = $1, notify_web_push = $2, updated_at = NOW() WHERE user_id = $3`,
      [!!notifyEmail, !!notifyWebPush, req.user.userId]
    );
    res.json({ message: 'Notification preferences updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update preferences' });
  }
};

module.exports = { getNotifications, markRead, markAllRead, updateNotificationSettings };
