const db = require('../config/db');
const { withTransaction } = require('../config/db');
const fineService = require('../services/fineService');
const notificationService = require('../services/notificationService');
const aiClient = require('../services/aiClient');

// ── Search & Browse ───────────────────────────────────────────────────────────

/**
 * GET /api/books
 * Query params: page, limit, category, author, available
 */
const getBooks = async (req, res) => {
  try {
    const page     = Math.max(1, parseInt(req.query.page) || 1);
    const limit    = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset   = (page - 1) * limit;
    const category = req.query.category || null;
    const authorId = req.query.author || null;
    const availableOnly = req.query.available === 'true';

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (category) {
      params.push(category);
      whereClause += ` AND c.category_id = $${params.length}`;
    }
    if (authorId) {
      params.push(authorId);
      whereClause += ` AND a.author_id = $${params.length}`;
    }
    if (availableOnly) {
      whereClause += ` AND b.available_copies > 0`;
    }

    params.push(limit, offset);
    const limitParam  = params.length - 1;
    const offsetParam = params.length;

    const result = await db.query(
      `SELECT b.book_id, b.title, b.isbn, b.publisher, b.publication_year,
              b.cover_image_url, b.total_copies, b.available_copies,
              a.name AS author_name, a.author_id,
              c.name AS category_name, c.category_id,
              b.digital_resource_id IS NOT NULL AS has_ebook
       FROM books b
       LEFT JOIN authors a    ON a.author_id    = b.author_id
       LEFT JOIN categories c ON c.category_id  = b.category_id
       ${whereClause}
       ORDER BY b.title
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      params
    );

    const countResult = await db.query(
      `SELECT COUNT(*) FROM books b
       LEFT JOIN categories c ON c.category_id = b.category_id
       LEFT JOIN authors a    ON a.author_id    = b.author_id
       ${whereClause}`,
      params.slice(0, params.length - 2) // exclude limit/offset
    );

    res.json({
      books: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page,
        limit,
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      },
    });
  } catch (err) {
    console.error('[BOOKS] getBooks error:', err.message);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
};

/**
 * GET /api/books/search
 * Query params: q (required), category, author, year, available, page, limit
 */
const searchBooks = async (req, res) => {
  try {
    const { q, category, author, year, available, page = 1, limit = 20 } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const pageNum   = Math.max(1, parseInt(page));
    const limitNum  = Math.min(50, Math.max(1, parseInt(limit)));
    const offset    = (pageNum - 1) * limitNum;

    const params = [`%${q.trim()}%`];
    let filterClause = '';

    if (category) {
      params.push(category);
      filterClause += ` AND c.category_id = $${params.length}`;
    }
    if (author) {
      params.push(`%${author}%`);
      filterClause += ` AND a.name ILIKE $${params.length}`;
    }
    if (year) {
      params.push(parseInt(year));
      filterClause += ` AND b.publication_year = $${params.length}`;
    }
    if (available === 'true') {
      filterClause += ` AND b.available_copies > 0`;
    }

    // Full-text search + trigram ILIKE fallback for partial matches
    const result = await db.query(
      `SELECT b.book_id, b.title, b.isbn, b.publisher, b.publication_year,
              b.cover_image_url, b.total_copies, b.available_copies,
              a.name AS author_name, a.author_id,
              c.name AS category_name, c.category_id,
              b.digital_resource_id IS NOT NULL AS has_ebook,
              ts_rank(b.search_vector, plainto_tsquery('english', $1)) AS rank
       FROM books b
       LEFT JOIN authors a    ON a.author_id    = b.author_id
       LEFT JOIN categories c ON c.category_id  = b.category_id
       WHERE (
         b.search_vector @@ plainto_tsquery('english', $1)
         OR b.title ILIKE $1
         OR b.isbn  ILIKE $1
         OR a.name  ILIKE $1
         OR b.publisher ILIKE $1
       )
       ${filterClause}
       ORDER BY rank DESC, b.title`,
      params
    );

    let books = result.rows;

    // If query looks like a natural-language question (> 3 words), ask AI to re-rank
    if (books.length > 0 && q.trim().split(/\s+/).length > 3) {
      const rankedIds = await aiClient.rerankSearch(q.trim(), books.map(b => ({
        book_id: b.book_id,
        title: b.title,
        description: null,
      })));
      const idOrder = Object.fromEntries(rankedIds.map((id, i) => [id, i]));
      books.sort((a, b) => (idOrder[a.book_id] ?? 999) - (idOrder[b.book_id] ?? 999));
    }

    const total = books.length;
    const paginatedBooks = books.slice(offset, offset + limitNum);

    res.json({
      books: paginatedBooks,
      query: q,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('[BOOKS] searchBooks error:', err.message);
    res.status(500).json({ error: 'Search failed' });
  }
};

/**
 * GET /api/books/:id
 */
const getBookById = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT b.book_id, b.title, b.isbn, b.publisher, b.publication_year,
              b.description, b.cover_image_url, b.total_copies, b.available_copies,
              a.name AS author_name, a.author_id, a.bio AS author_bio,
              c.name AS category_name, c.category_id,
              dr.resource_id AS ebook_id, dr.title AS ebook_title,
              dr.file_url AS ebook_url, dr.access_level AS ebook_access_level,
              dr.restricted_course AS ebook_restricted_course
       FROM books b
       LEFT JOIN authors a          ON a.author_id    = b.author_id
       LEFT JOIN categories c       ON c.category_id  = b.category_id
       LEFT JOIN digital_resources dr ON dr.resource_id = b.digital_resource_id
       WHERE b.book_id = $1`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const book = result.rows[0];

    // Get individual copies with location info
    const copiesResult = await db.query(
      `SELECT copy_id, accession_number, status, shelf_block, shelf_rack, shelf_shelf
       FROM book_copies
       WHERE book_id = $1
       ORDER BY accession_number`,
      [req.params.id]
    );

    // E-book fallback: surface e-book if no physical copies available
    const ebookFallback = book.available_copies === 0 && book.ebook_id
      ? {
          id:           book.ebook_id,
          title:        book.ebook_title,
          url:          book.ebook_url,
          accessLevel:  book.ebook_access_level,
          restrictedCourse: book.ebook_restricted_course,
        }
      : null;

    res.json({
      ...book,
      copies:        copiesResult.rows,
      ebookFallback, // null when physical copies are available
    });
  } catch (err) {
    console.error('[BOOKS] getBookById error:', err.message);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
};

// ── Create / Update / Delete (Librarian only) ─────────────────────────────────

/**
 * POST /api/books
 */
const createBook = async (req, res) => {
  const { title, isbn, publisher, publicationYear, description, categoryId, authorId, coverImageUrl, digitalResourceId } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  try {
    const result = await db.query(
      `INSERT INTO books (title, isbn, publisher, publication_year, description, category_id, author_id, cover_image_url, digital_resource_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING book_id`,
      [title, isbn || null, publisher || null, publicationYear || null, description || null, categoryId || null, authorId || null, coverImageUrl || null, digitalResourceId || null]
    );
    res.status(201).json({ bookId: result.rows[0].book_id, message: 'Book created' });
  } catch (err) {
    console.error('[BOOKS] createBook error:', err.message);
    res.status(500).json({ error: 'Failed to create book' });
  }
};

/**
 * PUT /api/books/:id
 */
const updateBook = async (req, res) => {
  const { title, isbn, publisher, publicationYear, description, categoryId, authorId, coverImageUrl, digitalResourceId } = req.body;
  try {
    const result = await db.query(
      `UPDATE books
       SET title=$1, isbn=$2, publisher=$3, publication_year=$4, description=$5,
           category_id=$6, author_id=$7, cover_image_url=$8, digital_resource_id=$9, updated_at=NOW()
       WHERE book_id=$10
       RETURNING book_id`,
      [title, isbn, publisher, publicationYear, description, categoryId, authorId, coverImageUrl, digitalResourceId, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Book not found' });
    res.json({ message: 'Book updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update book' });
  }
};

/**
 * DELETE /api/books/:id
 * HEAD_LIBRARIAN only (enforced in router)
 */
const deleteBook = async (req, res) => {
  try {
    // Check no active issues
    const activeIssues = await db.query(
      `SELECT COUNT(*) FROM issues i
       JOIN book_copies bc ON bc.copy_id = i.copy_id
       WHERE bc.book_id = $1 AND i.status IN ('ISSUED','OVERDUE')`,
      [req.params.id]
    );
    if (parseInt(activeIssues.rows[0].count) > 0) {
      return res.status(409).json({ error: 'Cannot delete: book has active issues' });
    }
    const result = await db.query(
      `DELETE FROM books WHERE book_id = $1 RETURNING book_id`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Book not found' });
    res.json({ message: 'Book deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete book' });
  }
};

/**
 * POST /api/books/bulk-import
 * Body: { books: [ { title, isbn, ... } ] }
 */
const bulkImportBooks = async (req, res) => {
  const { books } = req.body;
  if (!Array.isArray(books) || books.length === 0) {
    return res.status(400).json({ error: 'books array is required' });
  }

  const results = { created: 0, errors: [] };

  for (const book of books) {
    try {
      await db.query(
        `INSERT INTO books (title, isbn, publisher, publication_year, description, category_id, author_id, cover_image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (isbn) DO NOTHING`,
        [book.title, book.isbn || null, book.publisher || null, book.publicationYear || null,
         book.description || null, book.categoryId || null, book.authorId || null, book.coverImageUrl || null]
      );
      results.created++;
    } catch (err) {
      results.errors.push({ title: book.title, error: err.message });
    }
  }

  res.json(results);
};

// ── Authors & Categories ──────────────────────────────────────────────────────

const getAuthors = async (_req, res) => {
  const result = await db.query(`SELECT author_id, name FROM authors ORDER BY name`);
  res.json(result.rows);
};

const getCategories = async (_req, res) => {
  const result = await db.query(`SELECT category_id, name FROM categories ORDER BY name`);
  res.json(result.rows);
};

// ── Add a copy ────────────────────────────────────────────────────────────────

/**
 * POST /api/books/:id/copies
 * Body: { accessionNumber, shelfBlock, shelfRack, shelfShelf, qrCodeValue }
 */
const addCopy = async (req, res) => {
  const { accessionNumber, shelfBlock, shelfRack, shelfShelf, qrCodeValue } = req.body;
  if (!accessionNumber) return res.status(400).json({ error: 'accessionNumber is required' });

  try {
    const result = await db.query(
      `INSERT INTO book_copies (book_id, accession_number, shelf_block, shelf_rack, shelf_shelf, qr_code_value)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING copy_id`,
      [req.params.id, accessionNumber, shelfBlock, shelfRack, shelfShelf, qrCodeValue || `QR-${accessionNumber}`]
    );
    res.status(201).json({ copyId: result.rows[0].copy_id, message: 'Copy added' });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Accession number already exists' });
    res.status(500).json({ error: 'Failed to add copy' });
  }
};

module.exports = {
  getBooks,
  searchBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  bulkImportBooks,
  getAuthors,
  getCategories,
  addCopy,
};
