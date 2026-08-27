const express = require('express');
const router = express.Router();
const c = require('../controllers/notificationController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/',              authenticate, c.getNotifications);
router.put('/read-all',      authenticate, c.markAllRead);
router.put('/:id/read',      authenticate, c.markRead);
router.put('/settings',      authenticate, c.updateNotificationSettings);

module.exports = router;
