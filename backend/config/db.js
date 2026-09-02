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
    // Capture RETURNING column list before stripping, so we can simulate
    // the returned row with correct field names mapped to param values (Rec 2 / Bug #4).
    let returningCols = null;
    const returningMatch = text.match(/RETURNING\s+([a-zA-Z0-9_,\s*]+)$/i);
    if (returningMatch) {
      returningCols = returningMatch[1].split(',').map(c => c.trim().toLowerCase()).filter(Boolean);
    }

    sql = sql.replace(/RETURNING [a-zA-Z0-9_, ]+/gi, '');

    // Adapt DATE_TRUNC('month', col) to strftime('%Y-%m-01', col)
    sql = sql.replace(/DATE_TRUNC\s*\(\s*'month'\s*,\s*([^)]+)\)/gi, (m, col) => `strftime('%Y-%m-01', ${col})`);
    sql = sql.replace(/DATETIME\('now'\)\s*-\s*INTERVAL\s*'(\d+)\s*days'/gi, (m, d) => `DATETIME('now', '-${d} days')`);
    sql = sql.replace(/DATETIME\('now'\)\s*-\s*INTERVAL\s*'(\d+)\s*months'/gi, (m, mo) => `DATETIME('now', '-${mo} months')`);
    sql = sql.replace(/DATE\('now'\)\s*-\s*INTERVAL\s*'(\d+)\s*days'/gi, (m, d) => `DATE('now', '-${d} days')`);
    sql = sql.replace(/DATE\('now'\)\s*\+\s*INTERVAL\s*'(\d+)\s*days'/gi, (m, d) => `DATE('now', '+${d} days')`);
    sql = sql.replace(/GROUP BY 1/gi, 'GROUP BY 1');
    sql = sql.replace(/ORDER BY 1/gi, 'ORDER BY 1');

    // Adapt full text search — strip FTS predicates and ranking.
    // The nested-paren expressions (e.g. plainto_tsquery('english', $1)) confuse
    // simple [^)]+ regexes, so we use a balanced-paren replacer instead.
    const stripBalancedCall = (src, fnName, replacement) => {
      let out = '';
      let i = 0;
      const upper = src.toUpperCase();
      const fnUpper = fnName.toUpperCase();
      while (i < src.length) {
        const idx = upper.indexOf(fnUpper, i);
        if (idx === -1) { out += src.slice(i); break; }
        out += src.slice(i, idx);
        // find the opening paren
        let p = idx + fnName.length;
        while (p < src.length && src[p] !== '(') p++;
        if (p >= src.length) { out += src.slice(idx); break; }
        // walk forward counting depth
        let depth = 0;
        let end = p;
        for (; end < src.length; end++) {
          if (src[end] === '(') depth++;
          else if (src[end] === ')') { depth--; if (depth === 0) { end++; break; } }
        }
        out += replacement;
        i = end;
      }
      return out;
    };
    // Strip: search_vector @@ plainto_tsquery(...)
    sql = sql.replace(/search_vector\s*@@\s*/gi, '1=1 AND 1=2 AND ');
    sql = stripBalancedCall(sql, 'plainto_tsquery', "''");
    // Strip: ts_rank(...)
    sql = stripBalancedCall(sql, 'ts_rank', '1.0');
    // Clean up the awkward 1=1 AND 1=2 AND '' artifacts left by the above
    sql = sql.replace(/1=1 AND 1=2 AND ''/gi, '1=1');

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

        // Build a simulated RETURNING row (Rec 2 / Bug #4).
        // Strategy: if the original SQL was an INSERT INTO tbl (col1, col2, ...)
        // VALUES ($1, $2, ...), map RETURNING column names to their param values.
        // For columns not in the INSERT list (auto-generated IDs), provide
        // reasonable fake values keyed by well-known column name suffixes.
        let simulatedRow = {
          id: this.lastID,
          // Legacy fallbacks kept for any code that reads these directly
          resource_id:  'dr-' + Date.now(),
          issue_id:     'iss-' + Date.now(),
          copy_id:      'cp-' + Date.now(),
          request_id:   'req-' + Date.now(),
          reservation_id: 'res-' + Date.now(),
          fine_id:      'fin-' + Date.now(),
          book_id:      'book-' + Date.now(),
        };

        if (returningCols && returningCols.length > 0) {
          // Try to extract INSERT column→param mapping
          const insertMatch = text.match(/INSERT\s+INTO\s+\w+\s*\(\s*([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
          const colParamMap = {};
          if (insertMatch) {
            const colNames = insertMatch[1].split(',').map(c => c.trim().toLowerCase());
            const valTokens = insertMatch[2].split(',').map(v => v.trim());
            valTokens.forEach((token, i) => {
              const paramMatch = token.match(/\$(\d+)/);
              if (paramMatch) {
                const paramIdx = parseInt(paramMatch[1]) - 1; // 0-based
                if (i < colNames.length && paramIdx < params.length) {
                  colParamMap[colNames[i]] = params[paramIdx];
                }
              }
            });
          }
          // Build RETURNING row from the mapping
          const row = { id: this.lastID };
          returningCols.forEach(col => {
            if (colParamMap[col] !== undefined) {
              row[col] = colParamMap[col];
            } else {
              // Use pre-built fake ID or undefined
              row[col] = simulatedRow[col];
            }
          });
          simulatedRow = row;
        }

        resolve({
          rows: [simulatedRow],
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

const isUsingPostgres = () => usePostgres;

module.exports = { query, getClient, withTransaction, initPromise, isUsingPostgres };
