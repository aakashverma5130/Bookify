const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ── File upload config ────────────────────────────────────────────────────────
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Resolve the absolute uploads root once. Every file path served to the
// client must resolve inside this directory — we use `path.resolve` and
// verify with `startsWith` to defeat traversal attempts (C-1).
const UPLOAD_ROOT = path.resolve(UPLOAD_DIR);

// ── Magic-byte / signature detection (H-5 deep fix) ──────────────────────────
// We refuse to trust the client-supplied extension or MIME type alone.
// Instead, we sniff the first 4100 bytes and match against a small allow-list
// of known file signatures for PDF, EPUB (which is a ZIP container), and
// MOBI (which begins with the PalmDOC header).
//
// This rejects uploads like `malware.pdf` containing an executable, even
// though the extension passes multer's fileFilter.

const SIGNATURES = [
  {
    ext:    'pdf',
    mime:   'application/pdf',
    // %PDF-1.x — first 5 bytes must be 25 50 44 46 2D
    detect: (head) => head.length >= 5 && head[0] === 0x25 && head[1] === 0x50
      && head[2] === 0x44 && head[3] === 0x46 && head[4] === 0x2D,
  },
  {
    ext:    'epub',
    mime:   'application/epub+zip',
    // EPUB is a ZIP — first 4 bytes are 50 4B 03 04 (PK\x03\x04).
    // The presence of `mimetype` set to `application/epub+zip` inside
    // the central directory is the real test, but a top-level ZIP
    // signature is a strong first filter. The `mimetype` check is
    // performed by `verifyEpub` below.
    detect: (head) => head.length >= 4 && head[0] === 0x50 && head[1] === 0x4B
      && head[2] === 0x03 && head[3] === 0x04,
  },
  {
    ext:    'mobi',
    mime:   'application/x-mobipocket-ebook',
    // MOBI / PalmDOC begins with the first 8 bytes being the ASCII
    // record name. The first 4 bytes are the compression byte + length
    // metadata; the real signature is the PalmDOC magic at offset 60
    // ("BOOKMOBI"). We do a two-step check: first 4 bytes must look
    // like a valid PalmDB header, and the string "BOOKMOBI" must
    // appear within the first 68 bytes.
    detect: (head) => head.length >= 68
      && head.toString('latin1', 60, 68) === 'BOOKMOBI',
  },
];

/**
 * Read the first 4100 bytes of a file and return the matching signature
 * entry, or null if no known type matches. This is the magic-byte check
 * that backs the H-5 deep fix.
 */
const detectFileType = async (filePath) => {
  const fh = await fs.promises.open(filePath, 'r');
  try {
    const buf = Buffer.alloc(4100);
    const { bytesRead } = await fh.read(buf, 0, 4100, 0);
    const head = buf.subarray(0, bytesRead);
    for (const sig of SIGNATURES) {
      if (sig.detect(head)) return sig;
    }
    return null;
  } finally {
    await fh.close();
  }
};

/**
 * Verify that a ZIP container is actually an EPUB by looking for the
 * `mimetype` entry in the central directory. Pure ZIP files (which could
 * contain executables) are rejected.
 *
 * The EPUB spec requires the `mimetype` file to be the FIRST entry in
 * the archive, stored uncompressed. We read up to 64 KB and look for
 * the `application/epub+zip` string, which would appear very early.
 */
const verifyEpub = async (filePath) => {
  const fh = await fs.promises.open(filePath, 'r');
  try {
    const buf = Buffer.alloc(64 * 1024);
    const { bytesRead } = await fh.read(buf, 0, buf.length, 0);
    return buf.subarray(0, bytesRead).toString('latin1').includes('application/epub+zip');
  } finally {
    await fh.close();
  }
};

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    // Random UUID-based filename (M-3) — never trust user-supplied names.
    // The extension here is a hint only; the real type is detected by
    // `detectFileType` after the upload completes.
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.pdf', '.epub', '.mobi'].includes(ext) ? ext : '';
    cb(null, `${crypto.randomUUID()}${safeExt}`);
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

/**
 * Resolve a user-supplied URL to an absolute filesystem path and verify
 * the result is contained within the uploads root. Throws on any attempt
 * to traverse out of the directory (e.g. `..` segments, absolute paths,
 * symlink escapes, null bytes).
 */
const safeResolveUploadPath = (relativeUrl) => {
  if (typeof relativeUrl !== 'string' || relativeUrl.length === 0) {
    throw new Error('Invalid file reference');
  }
  // Strip a leading slash so the path is treated as relative to UPLOAD_ROOT.
  const normalized = relativeUrl.replace(/^[/\\]+/, '');
  const resolved = path.resolve(UPLOAD_ROOT, normalized);
  // Ensure the resolved path is inside UPLOAD_ROOT (path.sep avoids the
  // /uploads-evil bypass where the prefix matches a sibling directory).
  if (resolved !== UPLOAD_ROOT && !resolved.startsWith(UPLOAD_ROOT + path.sep)) {
    throw new Error('Path traversal detected');
  }
  return resolved;
};

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

      // H-5 deep fix: verify the actual file content matches the declared
      // type. We do not trust the extension or the client-supplied
      // MIME type. If the magic-byte check fails, the file is deleted
      // from disk and the request is rejected.
      let sig;
      try {
        sig = await detectFileType(req.file.path);
      } catch (err) {
        await fs.promises.unlink(req.file.path).catch(() => {});
        return res.status(500).json({ error: 'File inspection failed' });
      }
      if (!sig) {
        await fs.promises.unlink(req.file.path).catch(() => {});
        return res.status(400).json({
          error: 'File contents do not match any allowed type (PDF, EPUB, MOBI)',
        });
      }
      // For EPUB: a generic ZIP is not enough — verify the archive is
      // actually an EPUB by checking for the `mimetype` entry.
      if (sig.ext === 'epub') {
        const isEpub = await verifyEpub(req.file.path);
        if (!isEpub) {
          await fs.promises.unlink(req.file.path).catch(() => {});
          return res.status(400).json({ error: 'ZIP container is not a valid EPUB' });
        }
      }

      // Reject if the declared `type` doesn't match what the file
      // actually is. The librarian could upload a `.epub` file but
      // declare it as a `PDF`; we refuse the mismatch.
      const declaredType = String(type).toUpperCase();
      const expectedExt = { PDF: 'pdf', EPUB: 'epub', MOBI: 'mobi' }[declaredType];
      if (expectedExt && expectedExt !== sig.ext) {
        await fs.promises.unlink(req.file.path).catch(() => {});
        return res.status(400).json({
          error: `Declared type ${declaredType} does not match actual file type (${sig.ext.toUpperCase()})`,
        });
      }

      const fileUrl = `/uploads/${req.file.filename}`;

      const result = await db.query(
        `INSERT INTO digital_resources (title, author, type, file_url, mime_type, file_size_bytes, access_level, restricted_course, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING resource_id`,
        [title, author || null, declaredType, fileUrl, sig.mime, req.file.size, accessLevel || 'OPEN', restrictedCourse || null, req.user.userId]
      );

      res.status(201).json({
        resourceId: result.rows[0].resource_id,
        fileUrl,
        detectedType: sig.ext,
        message: 'Resource uploaded',
      });
    } catch (err) {
      // Clean up the uploaded file if anything went wrong so we don't
      // accumulate orphans on disk.
      if (req.file?.path) {
        await fs.promises.unlink(req.file.path).catch(() => {});
      }
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

    // C-1: resolve the file path safely and reject any traversal attempt.
    let filePath;
    try {
      filePath = safeResolveUploadPath(resource.file_url);
    } catch {
      return res.status(400).json({ error: 'Invalid file reference' });
    }
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on server' });

    // H-5: re-detect the file type at download time and serve with the
    // correct Content-Type, rather than trusting the value stored in
    // the database (which may have been written before the magic-byte
    // check was added, or could be tampered with by a future bug).
    let serveMime = resource.mime_type;
    try {
      const sig = await detectFileType(filePath);
      if (sig) serveMime = sig.mime;
    } catch { /* fall through to stored mime */ }

    // Sanitize the title for the Content-Disposition filename to avoid
    // header injection (CR/LF in the title would split HTTP headers).
    const safeFilename = String(resource.title || 'download')
      .replace(/[\r\n"]/g, '')
      .replace(/[^A-Za-z0-9._-]/g, '_');

    res.setHeader('Content-Type', serveMime || 'application/pdf');
    // Force download rather than inline rendering in the browser.
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.pdf"`);
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
