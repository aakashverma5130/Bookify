const { body, param, query, validationResult } = require('express-validator');

/**
 * Generic validation handler — returns 400 with a list of error messages
 * if any of the registered validators failed.
 *
 * Response shape:
 *   { error: 'Validation failed', details: [{ field, message }, ...] }
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path || e.param, message: e.msg })),
    });
  }
  next();
};

/**
 * Trim and length-limit string fields. Used as a sanitizer after the
 * initial `body(...)` chain.
 */
const sanitizeString = (field, { min = 0, max = 1000 } = {}) =>
  body(field).trim().isLength({ min, max }).withMessage(`${field} must be ${min}-${max} characters`);

/**
 * ID validation that accepts BOTH UUIDs (production / PostgreSQL) AND
 * short human-readable IDs (development / SQLite seed data).
 *
 * Why both? Production issues real UUIDs; the SQLite fallback seeds
 * short codes like `b-1`, `s-1`, `cp-1`, `iss-1`, `dr-1`. We need the
 * validation to accept either so the same endpoint works in both modes.
 *
 * What we still block (this is the security contract):
 *   - Empty strings
 *   - Strings longer than 64 chars
 *   - Strings containing anything that isn't `[A-Za-z0-9_-]`
 *   - Strings starting with `-` (could be misinterpreted as a flag)
 *
 * The allowed character set is the strict intersection of:
 *   - UUID character set: `[0-9a-f-]`
 *   - Short-id character set: `[A-Za-z0-9-]`
 *   - Our constraint: `[A-Za-z0-9_-]`
 *
 * Note: parameter `field` is the express-validator field path (e.g. 'id'
 * for a URL param or 'studentId' for a body field).
 */
const idOrUuid = (field, { location = 'param' } = {}) => {
  // Reject anything outside [A-Za-z0-9_-], length 1..64, not starting with '-'.
  // This is safe across both UUIDs and the seed-data short IDs.
  const chain = (location === 'body' ? body(field) : param(field))
    .trim()
    .notEmpty().withMessage(`${field} is required`)
    .isLength({ min: 1, max: 64 }).withMessage(`${field} must be 1-64 characters`)
    .matches(/^[A-Za-z0-9_][A-Za-z0-9_-]*$/)
      .withMessage(`${field} must contain only letters, numbers, underscores, or hyphens`);
  return chain;
};

/* ── Reusable chains ──────────────────────────────────────────────────────── */

const issueBookValidation = [
  idOrUuid('studentId', { location: 'body' }),
  idOrUuid('copyId',    { location: 'body' }),
  handleValidation,
];

const returnBookValidation = [
  body('condition').optional().isIn(['GOOD', 'DAMAGED']).withMessage('condition must be GOOD or DAMAGED'),
  body('notes').optional().isString().isLength({ max: 500 }),
  handleValidation,
];

const renewBookValidation = [
  idOrUuid('id', { location: 'param' }),
  handleValidation,
];

const createBookValidation = [
  body('title').trim().isLength({ min: 1, max: 300 }),
  body('isbn').optional().isString().isLength({ max: 20 }),
  body('publisher').optional().isString().isLength({ max: 200 }),
  body('publicationYear').optional().isInt({ min: 1000, max: 9999 }),
  body('description').optional().isString().isLength({ max: 5000 }),
  body('categoryId').optional({ values: 'falsy' }).custom(v => !v || /^[A-Za-z0-9_-]{1,64}$/.test(v)),
  body('authorId').optional({ values: 'falsy' }).custom(v => !v || /^[A-Za-z0-9_-]{1,64}$/.test(v)),
  body('coverImageUrl').optional({ values: 'falsy' }).isURL({ require_protocol: false }).isLength({ max: 500 }),
  body('digitalResourceId').optional({ values: 'falsy' }).custom(v => !v || /^[A-Za-z0-9_-]{1,64}$/.test(v)),
  handleValidation,
];

const updateBookValidation = [
  body('title').optional().trim().isLength({ min: 1, max: 300 }),
  body('isbn').optional().isString().isLength({ max: 20 }),
  body('publisher').optional().isString().isLength({ max: 200 }),
  body('publicationYear').optional().isInt({ min: 1000, max: 9999 }),
  body('description').optional().isString().isLength({ max: 5000 }),
  body('categoryId').optional({ values: 'falsy' }).custom(v => !v || /^[A-Za-z0-9_-]{1,64}$/.test(v)),
  body('authorId').optional({ values: 'falsy' }).custom(v => !v || /^[A-Za-z0-9_-]{1,64}$/.test(v)),
  body('coverImageUrl').optional({ values: 'falsy' }).isURL({ require_protocol: false }).isLength({ max: 500 }),
  body('digitalResourceId').optional({ values: 'falsy' }).custom(v => !v || /^[A-Za-z0-9_-]{1,64}$/.test(v)),
  idOrUuid('id', { location: 'param' }),
  handleValidation,
];

const addCopyValidation = [
  body('accessionNumber').trim().isLength({ min: 1, max: 50 }),
  body('shelfBlock').optional().isString().isLength({ max: 10 }),
  body('shelfRack').optional().isString().isLength({ max: 10 }),
  body('shelfShelf').optional().isString().isLength({ max: 10 }),
  body('qrCodeValue').optional().isString().isLength({ max: 200 }),
  idOrUuid('id', { location: 'param' }),
  handleValidation,
];

const purchaseRequestValidation = [
  body('title').trim().isLength({ min: 1, max: 300 }),
  body('author').optional().isString().isLength({ max: 200 }),
  body('isbn').optional().isString().isLength({ max: 20 }),
  body('reason').trim().isLength({ min: 1, max: 1000 }),
  handleValidation,
];

const purchaseDecisionValidation = [
  body('status').isIn(['APPROVED', 'REJECTED']),
  body('librarianNotes').optional().isString().isLength({ max: 1000 }),
  idOrUuid('id', { location: 'param' }),
  handleValidation,
];

const reservationValidation = [
  idOrUuid('bookId', { location: 'body' }),
  handleValidation,
];

/**
 * Param validator for routes like `/api/admin/students/:id/suspend`.
 * Accepts both UUIDs (production) and short IDs (seed data).
 */
const idParam = (paramName = 'id') => [
  idOrUuid(paramName, { location: 'param' }),
  handleValidation,
];

// Backwards-compat alias for code that still expects the old name.
const uuidParam = idParam;

const notificationUpdateValidation = [
  body('notifyEmail').optional().isBoolean(),
  body('notifyWebPush').optional().isBoolean(),
  handleValidation,
];

const settingsValidation = [
  body('finePerDay').isFloat({ min: 0, max: 1000 }),
  body('maxBooksPerStudent').isInt({ min: 1, max: 20 }),
  body('defaultLoanDays').isInt({ min: 1, max: 365 }),
  body('renewalLimit').isInt({ min: 0, max: 10 }),
  body('seatGraceMinutes').isInt({ min: 0, max: 120 }),
  handleValidation,
];

const paginationValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  (req, _res, next) => {
    // Normalize so the controllers can read them safely.
    if (req.query.page) req.query.page = parseInt(req.query.page, 10);
    if (req.query.limit) req.query.limit = parseInt(req.query.limit, 10);
    next();
  },
];

module.exports = {
  handleValidation,
  idOrUuid,
  issueBookValidation,
  returnBookValidation,
  renewBookValidation,
  createBookValidation,
  updateBookValidation,
  addCopyValidation,
  purchaseRequestValidation,
  purchaseDecisionValidation,
  reservationValidation,
  idParam,
  uuidParam, // alias
  notificationUpdateValidation,
  settingsValidation,
  paginationValidation,
};
