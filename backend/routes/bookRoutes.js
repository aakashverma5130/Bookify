const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole, LIBRARIAN_ROLES, HEAD_ONLY } = require('../middleware/roleMiddleware');

// Public-ish (still requires auth to protect the system)
router.get('/',              authenticate, bookController.getBooks);
router.get('/search',        authenticate, bookController.searchBooks);
router.get('/authors',       authenticate, bookController.getAuthors);
router.get('/categories',    authenticate, bookController.getCategories);
router.get('/:id',           authenticate, bookController.getBookById);
router.post('/:id/copies',   authenticate, requireRole(...LIBRARIAN_ROLES), bookController.addCopy);

// Librarian-only catalog management
router.post('/',             authenticate, requireRole(...LIBRARIAN_ROLES), bookController.createBook);
router.put('/:id',           authenticate, requireRole(...LIBRARIAN_ROLES), bookController.updateBook);
router.delete('/:id',        authenticate, requireRole(...HEAD_ONLY),       bookController.deleteBook);
router.post('/bulk-import',  authenticate, requireRole(...LIBRARIAN_ROLES), bookController.bulkImportBooks);

module.exports = router;
