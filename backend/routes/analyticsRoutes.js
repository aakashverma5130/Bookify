const express = require('express');
const router = express.Router();
const c = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole, LIBRARIAN_ROLES, HEAD_ONLY } = require('../middleware/roleMiddleware');
const { settingsValidation, uuidParam } = require('../middleware/validation');

const libOnly  = [authenticate, requireRole(...LIBRARIAN_ROLES)];
const headOnly = [authenticate, requireRole(...HEAD_ONLY)];

router.get('/dashboard',            ...libOnly,  c.getDashboard);
router.get('/reports',              ...libOnly,  c.getReports);
router.get('/demand-forecast',      ...libOnly,  c.getDemandForecast);
router.get('/students',             ...libOnly,  c.getStudents);
router.put('/students/:id/suspend', ...headOnly, uuidParam(), c.suspendStudent);
router.put('/students/:id/activate',...libOnly,  uuidParam(), c.activateStudent);
router.get('/settings',             ...libOnly,  c.getSettings);
router.put('/settings',             ...headOnly, settingsValidation, c.updateSettings);

module.exports = router;
