const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── File upload config ────────────────────────────────────────────────────────
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['.pdf', '.epub', '.mobi'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, EPUB, and MOBI files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 50) * 1024 * 1024 },
});

// ── Handlers ──────────────────────────────────────────────────────────────────

const getDigitalResources = async (req, res) => {
  try {
    const { type, access } = req.query;
    const params = [];
    let where = 'WHERE dr.is_active = TRUE';
    if (type) { params.push(type.toUpperCase()); where += ` AND dr.type = $${params.length}`; }
    if (access) { params.push(access.toUpperCase()); where += ` AND dr.access_level = $${params.length}`; }

    const result = await db.query(
      `SELECT dr.resource_id, dr.title, dr.author, dr.type, dr.access_level,
              dr.restricted_course, dr.upload_date, dr.download_count, dr.avg_read_time_mins
       FROM digital_resources dr
       ${where}
       ORDER BY dr.title`,
      params
    );
    res.json({ resources: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch digital resources' });
  }
};

const uploadDigitalResource = [
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const { title, author, type, accessLevel, restrictedCourse } = req.body;
      if (!title || !type) return res.status(400).json({ error: 'title and type are required' });

      const fileUrl = `/uploads/${req.file.filename}`;
      const mimeType = req.file.mimetype;

      const result = await db.query(
        `INSERT INTO digital_resources (title, author, type, file_url, mime_type, file_size_bytes, access_level, restricted_course, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING resource_id`,
        [title, author || null, type.toUpperCase(), fileUrl, mimeType, req.file.size, accessLevel || 'OPEN', restrictedCourse || null, req.user.userId]
      );

      res.status(201).json({ resourceId: result.rows[0].resource_id, fileUrl, message: 'Resource uploaded' });
    } catch (err) {
      res.status(500).json({ error: err.message || 'Upload failed' });
    }
  },
];

const downloadDigitalResource = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT file_url, title, mime_type, access_level, restricted_course FROM digital_resources WHERE resource_id = $1 AND is_active = TRUE`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Resource not found' });

    const resource = result.rows[0];

    // Access control for course-restricted resources (students only check)
    if (resource.access_level === 'COURSE_RESTRICTED' && req.user.role === 'STUDENT') {
      const studentResult = await db.query(
        `SELECT course FROM students WHERE user_id = $1`,
        [req.user.userId]
      );
      if (!studentResult.rows.length || studentResult.rows[0].course !== resource.restricted_course) {
        return res.status(403).json({ error: 'Access restricted to enrolled course students' });
      }
    }

    // Increment download count
    await db.query(
      `UPDATE digital_resources SET download_count = download_count + 1 WHERE resource_id = $1`,
      [req.params.id]
    );

    const filePath = path.join(__dirname, '..', resource.file_url);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on server' });

    res.setHeader('Content-Type', resource.mime_type || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${resource.title}.pdf"`);
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ error: 'Download failed' });
  }
};

const getResourceStats = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT resource_id, title, download_count, avg_read_time_mins, upload_date FROM digital_resources WHERE resource_id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Resource not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

module.exports = { getDigitalResources, uploadDigitalResource, downloadDigitalResource, getResourceStats };
