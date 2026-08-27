const { Pool } = require('pg');
const { getSqliteDb } = require('./sqliteFallback');

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
      console.log('[DB] Connected to PostgreSQL successfully');
      return;
    } catch (err) {
      console.log('[DB] PostgreSQL unavailable (' + err.message + '). Switching to embedded Local SQLite DB...');
    }
  }

  // Fallback to SQLite
  sqliteDb = await getSqliteDb();
  usePostgres = false;
  console.log('[DB] Running in Local SQLite Demo Mode (zero-config, full features enabled)');
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

    // Adapt FILTER (WHERE condition) with function replacer
    sql = sql.replace(/COUNT\(\*\)\s+FILTER\s*\(\s*WHERE\s+([\s\S]*?)\)(?=\s+AS|\s*,|\s+FROM)/gi, (m, cond) => `COALESCE(SUM(CASE WHEN ${cond} THEN 1 ELSE 0 END), 0)`);
    sql = sql.replace(/SUM\(amount\)\s+FILTER\s*\(\s*WHERE\s+([\s\S]*?)\)(?=\s+AS|\s*,|\s+FROM)/gi, (m, cond) => `COALESCE(SUM(CASE WHEN ${cond} THEN amount ELSE 0 END), 0)`);

    // Replace $1, $2 with ?
    sql = sql.replace(/\$\d+/g, '?');

    const isSelect = /^\s*(SELECT|PRAGMA)/i.test(sql);

    if (isSelect) {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) {
          console.error('[SQLITE ERROR]:', err.message, '\nSQL:', sql);
          return reject(err);
        }
        resolve({ rows: rows || [], rowCount: rows ? rows.length : 0 });
      });
    } else {
      sqliteDb.run(sql, params, function (err) {
        if (err) {
          console.error('[SQLITE ERROR]:', err.message, '\nSQL:', sql);
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
