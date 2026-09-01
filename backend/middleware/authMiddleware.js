const jwt = require('jsonwebtoken');
const db = require('../config/db');
const log = require('../logger');

/**
 * Middleware: verify JWT in Authorization header and ensure the token
 * hasn't been revoked via the `token_version` (H-3) mechanism.
 *
 * On success, attaches req.user = { userId, role }.
 * On failure, responds with 401.
 *
 * A lightweight in-memory cache (tvCache) holds the latest `token_version`
 * for each user for 60 seconds. The cache is best-effort; misses simply
 * hit the database. For multi-instance deployments, swap this for Redis.
 */
const TV_CACHE_TTL_MS = 60 * 1000;
const tvCache = new Map(); // userId -> { tv, isActive, role, expiresAt }

const getCachedTokenState = (userId) => {
  const entry = tvCache.get(userId);
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    tvCache.delete(userId);
    return undefined;
  }
  return entry;
};

const setCachedTokenState = (userId, tv, isActive, role) => {
  tvCache.set(userId, { tv, isActive, role, expiresAt: Date.now() + TV_CACHE_TTL_MS });
};

/**
 * Invalidate the cached `token_version`, `is_active`, and `role` for a user.
 * Called from:
 *   - the auth controller when `bumpTokenVersion` runs (logout, password
 *     reset) so the revocation is detected immediately
 *   - admin endpoints that change a user's role or `is_active` flag
 */
const invalidateTokenCache = (userId) => {
  if (userId) tvCache.delete(userId);
};

const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.slice(7);
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }

  // L-3: compare the token's `tv` claim against the user's current
  // `token_version`, and re-verify `is_active` + `role`. If they don't
  // match, the token has been revoked (logout, password reset, role
  // change, account suspension, etc.).
  const claimedTv = payload.tv ?? 0;
  let cached = getCachedTokenState(payload.userId);
  if (!cached) {
    try {
      const result = await db.query(
        `SELECT token_version, is_active, role FROM users WHERE user_id = $1`,
        [payload.userId]
      );
      if (!result.rows.length) {
        return res.status(401).json({ error: 'User no longer exists' });
      }
      const { token_version, is_active, role } = result.rows[0];
      cached = { tv: token_version || 0, isActive: !!is_active, role };
      setCachedTokenState(payload.userId, cached.tv, cached.isActive, cached.role);
    } catch (err) {
      log.error('auth_user_lookup_failed', { message: err.message });
      // Fail closed: refuse the request if we can't verify revocation state.
      return res.status(503).json({ error: 'Auth service temporarily unavailable' });
    }
  }

  if (claimedTv !== cached.tv) {
    return res.status(401).json({ error: 'Token revoked' });
  }
  if (!cached.isActive) {
    return res.status(403).json({ error: 'Account is deactivated' });
  }
  // L-3: if the user's role was changed, reject the token unless the
  // new role still matches the role baked into the token. This stops a
  // user whose role was downgraded from STUDENT to nothing from
  // continuing to call student-only routes until the JWT expires.
  if (cached.role !== payload.role) {
    return res.status(403).json({ error: 'Role has changed — please re-authenticate' });
  }

  req.user = { userId: payload.userId, role: payload.role };
  next();
};

module.exports = { authenticate, invalidateTokenCache };
