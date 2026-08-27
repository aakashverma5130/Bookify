const express = require('express');
const router = express.Router();
const c = require('../controllers/digitalResourceController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole, LIBRARIAN_ROLES } = require('../middleware/roleMiddleware');

router.get('/',                 authenticate, c.getDigitalResources);
router.post('/',                authenticate, requireRole(...LIBRARIAN_ROLES), c.uploadDigitalResource);
router.get('/:id/download',     authenticate, c.downloadDigitalResource);
router.get('/:id/stats',        authenticate, requireRole(...LIBRARIAN_ROLES), c.getResourceStats);

module.exports = router;
