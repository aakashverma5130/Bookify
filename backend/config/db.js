const { Pool } = require('pg');
const { getSqliteDb } = require('./sqliteFallback');
const log = require('../logger');

let usePostgres = false;
let pgPool = null;
let sqliteDb = null;

// Initialize connection strategy
const initDb = async () => {
  if (process.env.DATABASE_URL) {
    try {
      const testPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 1500,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      });
      await testPool.query('SELECT 1');
      pgPool = testPool;
      usePostgres = true;
      log.info('db_connected', { driver: 'postgres' });
      return;
    } catch (err) {
      log.warn('db_postgres_unavailable', { message: err.message });
    }
  }

  // Fallback to SQLite
  sqliteDb = await getSqliteDb();
  usePostgres = false;
  log.info('db_connected', { driver: 'sqlite', mode: 'demo' });
};

// Auto-init on module load
const initPromise = initDb();

/**
 * Execute a query with parameters ($1, $2, ... for PG; adapted to ? for SQLite)
 */
const query = async (text, params = []) => {
  await initPromise;

  if (usePostgres && pgPool) {
    return pgPool.query(text, params);
  }

  // SQLite Adapter
  return new Promise((resolve, reject) => {
    let sql = text;

    // Strip PostgreSQL typecasts (e.g. ::TIME, ::INTEGER, ::TEXT)
    sql = sql.replace(/::[a-zA-Z0-9_]+/gi, '');

    // Adapt GREATEST/LEAST. SQLite added MAX/MIN support, but not
    // GREATEST until very late. We rewrite GREATEST(a, b, ...) as a
    // nested MAX() expression which is supported on all SQLite versions.
    // IMPORTANT: this must run BEFORE we expand CURRENT_DATE → DATE('now'),
    // because the adapter's regex doesn't allow nested parens.
    const adaptGreatest = (m, args) => {
      const parts = args.split(',').map(s => s.trim()).filter(Boolean);
      let expr = parts[0];
      for (let i = 1; i < parts.length; i++) expr = `MAX(${expr}, ${parts[i]})`;
      return expr;
    };
    sql = sql.replace(/GREATEST\s*\(([^()]+?)\)/gi, adaptGreatest);
    const adaptLeast = (m, args) => {
      const parts = args.split(',').map(s => s.trim()).filter(Boolean);
      let expr = parts[0];
      for (let i = 1; i < parts.length; i++) expr = `MIN(${expr}, ${parts[i]})`;
      return expr;
    };
    sql = sql.replace(/LEAST\s*\(([^()]+?)\)/gi, adaptLeast);

    // Adapt common PostgreSQL specific syntax to SQLite
    sql = sql.replace(/ILIKE/gi, 'LIKE');
    sql = sql.replace(/IS TRUE/gi, '= 1');
    sql = sql.replace(/IS FALSE/gi, '= 0');
    sql = sql.replace(/TRUE/g, '1');
    sql = sql.replace(/FALSE/g, '0');
    sql = sql.replace(/NOW\(\)/gi, "DATETIME('now')");
    sql = sql.replace(/CURRENT_DATE/gi, "DATE('now')");
    sql = sql.replace(/RETURNING [a-zA-Z0-9_, ]+/gi, '');

    // Adapt DATE_TRUNC('month', col) to strftime('%Y-%m-01', col)
    sql = sql.replace(/DATE_TRUNC\s*\(\s*'month'\s*,\s*([^)]+)\)/gi, (m, col) => `strftime('%Y-%m-01', ${col})`);
    sql = sql.replace(/DATETIME\('now'\)\s*-\s*INTERVAL\s*'(\d+)\s*days'/gi, (m, d) => `DATETIME('now', '-${d} days')`);
    sql = sql.replace(/DATETIME\('now'\)\s*-\s*INTERVAL\s*'(\d+)\s*months'/gi, (m, mo) => `DATETIME('now', '-${mo} months')`);
    sql = sql.replace(/DATE\('now'\)\s*-\s*INTERVAL\s*'(\d+)\s*days'/gi, (m, d) => `DATE('now', '-${d} days')`);
    sql = sql.replace(/DATE\('now'\)\s*\+\s*INTERVAL\s*'(\d+)\s*days'/gi, (m, d) => `DATE('now', '+${d} days')`);
    sql = sql.replace(/GROUP BY 1/gi, 'GROUP BY 1');
    sql = sql.replace(/ORDER BY 1/gi, 'ORDER BY 1');

    // Adapt full text search
    sql = sql.replace(/search_vector\s*@@\s*plainto_tsquery\([^)]+\)/gi, "1=1");
    sql = sql.replace(/ts_rank\([^)]+\)/gi, "1.0");

    // Strip PostgreSQL row-level locking clauses. SQLite is single-writer
    // so locking is implicit; the FOR UPDATE / FOR UPDATE OF keywords
    // cause a syntax error. The semantics we lose are: explicit row locks
    // to prevent concurrent updates. In dev this is acceptable; in
    // production we run against PostgreSQL where these are preserved.
    sql = sql.replace(/\bFOR\s+UPDATE(\s+OF\s+[a-zA-Z0-9_,\s]+)?/gi, '');

    // Adapt FILTER (WHERE condition) with function replacer
    sql = sql.replace(/COUNT\(\*\)\s+FILTER\s*\(\s*WHERE\s+([\s\S]*?)\)(?=\s+AS|\s*,|\s+FROM)/gi, (m, cond) => `COALESCE(SUM(CASE WHEN ${cond} THEN 1 ELSE 0 END), 0)`);
    sql = sql.replace(/SUM\(amount\)\s+FILTER\s*\(\s*WHERE\s+([\s\S]*?)\)(?=\s+AS|\s*,|\s+FROM)/gi, (m, cond) => `COALESCE(SUM(CASE WHEN ${cond} THEN amount ELSE 0 END), 0)`);

    // Replace $1, $2 with ?
    sql = sql.replace(/\$\d+/g, '?');

    const isSelect = /^\s*(SELECT|PRAGMA)/i.test(sql);

    if (isSelect) {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) {
          // L-1: log the error message but NOT the full rewritten SQL
          // (which can include user-supplied substrings in the FILTER
          // adapter). The error code is sufficient for debugging.
          log.error('db_sqlite_query_failed', {
            code: err.code,
            message: err.message,
            sqlPreview: sql.slice(0, 200),
          });
          return reject(err);
        }
        resolve({ rows: rows || [], rowCount: rows ? rows.length : 0 });
      });
    } else {
      sqliteDb.run(sql, params, function (err) {
        if (err) {
          log.error('db_sqlite_exec_failed', {
            code: err.code,
            message: err.message,
            sqlPreview: sql.slice(0, 200),
          });
          return reject(err);
        }
        // If query was expecting a returned id, simulate it with lastID or random uuid
        resolve({
          rows: [{ id: this.lastID, resource_id: 'dr-' + Date.now(), issue_id: 'iss-' + Date.now(), copy_id: 'cp-' + Date.now() }],
          rowCount: this.changes,
          lastID: this.lastID
        });
      });
    }
  });
};

const getClient = async () => {
  await initPromise;
  if (usePostgres && pgPool) {
    return pgPool.connect();
  }
  return {
    query,
    release: () => {}
  };
};

const withTransaction = async (fn) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { query, getClient, withTransaction, initPromise };
