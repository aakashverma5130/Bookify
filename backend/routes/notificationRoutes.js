const express = require('express');
const router = express.Router();
const c = require('../controllers/notificationController');
const { authenticate } = require('../middleware/authMiddleware');
const { notificationUpdateValidation, uuidParam } = require('../middleware/validation');

router.get('/',              authenticate, c.getNotifications);
router.put('/read-all',      authenticate, c.markAllRead);
router.put('/:id/read',      authenticate, uuidParam(), c.markRead);
router.put('/settings',      authenticate, notificationUpdateValidation, c.updateNotificationSettings);

module.exports = router;
