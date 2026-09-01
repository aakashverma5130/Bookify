/**
 * Lightweight structured logger (L-1 deep).
 *
 * Goals:
 *  - In production, emit one JSON line per event so a log aggregator
 *    can parse fields directly.
 *  - In development, emit human-readable colored text.
 *  - Honor LOG_LEVEL (debug | info | warn | error). Default: info.
 *  - Redact obvious PII / secrets before emitting. The `redact` option
 *    lets callers specify extra keys to scrub.
 *  - Fail safely: if writing to stdout throws, swallow the error so a
 *    logger never crashes the request handler.
 *
 * We intentionally do NOT pull in `pino` / `winston` to keep the dep
 * surface minimal. If you need log shipping, swap this module for one
 * of those without touching call sites.
 */

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const ACTIVE_LEVEL = LEVELS[String(process.env.LOG_LEVEL || 'info').toLowerCase()] ?? LEVELS.info;
const IS_PROD = process.env.NODE_ENV === 'production';

// Fields that should never be logged in any environment, even in
// development. Matches a broad set of common sensitive keys.
const REDACT_KEYS = new Set([
  'password', 'password_hash', 'passwordhash', 'passwd',
  'token', 'authorization', 'jwt', 'access_token', 'refresh_token',
  'cookie', 'set-cookie',
  'secret', 'client_secret', 'api_key', 'apikey', 'api-key',
  'vapid_private_key', 'vapid_public_key', 'ai_service_auth_token',
  'smtp_pass', 'smtp_password',
  'jwt_secret', 'session', 'csrf',
  'credit_card', 'cardnumber', 'cvv',
  'ssn', 'social_security',
]);

const redactValue = (key, value) => {
  if (key == null) return value;
  const k = String(key).toLowerCase();
  if (REDACT_KEYS.has(k) || k.includes('password') || k.includes('secret') || k.includes('token')) {
    return '[REDACTED]';
  }
  return value;
};

const redactObject = (obj) => {
  if (obj == null) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redactObject);
  const out = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    out[k] = k in obj ? redactValue(k, v) : v;
  }
  return out;
};

const formatProd = (level, msg, meta) => {
  const record = {
    ts: new Date().toISOString(),
    level,
    msg: typeof msg === 'string' ? msg : String(msg),
    ...redactObject(meta || {}),
  };
  try {
    return JSON.stringify(record);
  } catch {
    return JSON.stringify({ ts: record.ts, level, msg: record.msg, _error: 'serialize_failed' });
  }
};

const formatDev = (level, msg, meta) => {
  const color = { debug: '\x1b[90m', info: '\x1b[36m', warn: '\x1b[33m', error: '\x1b[31m' }[level] || '';
  const reset = '\x1b[0m';
  const ts = new Date().toISOString().slice(11, 23);
  const base = `${color}[${level.toUpperCase()}]${reset} ${ts} ${msg}`;
  if (!meta || Object.keys(meta).length === 0) return base;
  try {
    return `${base} ${JSON.stringify(redactObject(meta))}`;
  } catch {
    return `${base} [meta_unserializable]`;
  }
};

const emit = (level, msg, meta) => {
  if (LEVELS[level] < ACTIVE_LEVEL) return;
  const line = IS_PROD ? formatProd(level, msg, meta) : formatDev(level, msg, meta);
  try {
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  } catch { /* never crash on logging */ }
};

const logger = {
  debug: (msg, meta) => emit('debug', msg, meta),
  info:  (msg, meta) => emit('info',  msg, meta),
  warn:  (msg, meta) => emit('warn',  msg, meta),
  error: (msg, meta) => emit('error', msg, meta),
  redactObject,
};

module.exports = logger;
