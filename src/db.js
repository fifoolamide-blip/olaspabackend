const { Pool } = require('pg');

// Constructs the Postgres connection string from individual PG* environment variables
// (PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE) injected as Railway reference variables
// from the Postgres service. This avoids relying on a single DATABASE_URL reference variable,
// which Railway does not always expand correctly across services. The pool is lazy-loaded so
// the variables are read only when the first query is made.
let _pool = null;

const buildConnectionString = () => {
  const host     = process.env.PGHOST;
  const port     = process.env.PGPORT     || '5432';
  const user     = process.env.PGUSER;
  const password = process.env.PGPASSWORD;
  const database = process.env.PGDATABASE;

  const missing = ['PGHOST', 'PGUSER', 'PGPASSWORD', 'PGDATABASE'].filter(
    (key) => !process.env[key]
  );

  if (missing.length > 0) {
    // Log clearly so the Railway log stream shows exactly what is missing,
    // then throw so callers can decide whether to crash or retry later.
    const msg =
      `Missing required Postgres environment variable(s): ${missing.join(', ')}. ` +
      'Ensure PGHOST, PGPORT, PGUSER, PGPASSWORD, and PGDATABASE are set as ' +
      'reference variables from the Postgres service in Railway.';
    console.error(`❌ DB config error: ${msg}`);
    throw new Error(msg);
  }

  // Encode user/password to handle special characters safely in the URL.
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
};

const getPool = () => {
  if (_pool) return _pool;

  const connectionString = buildConnectionString();

  _pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
  });

  _pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL client error:', err);
  });

  console.log('🔌 PostgreSQL pool initialised');
  return _pool;
};

// Tracks whether createTables() has successfully run at least once so we
// don't repeat the DDL on every query.
let _tablesCreated = false;

// Ensures tables exist before the first real query is executed.  Subsequent
// calls are no-ops once _tablesCreated is true.
const ensureTablesCreated = async () => {
  if (_tablesCreated) return;
  try {
    await createTables();
    _tablesCreated = true;
  } catch (err) {
    // Don't block the query — the caller will surface its own error if the
    // table genuinely doesn't exist yet.
    console.warn('⚠️  ensureTablesCreated: table creation deferred —', err.message);
  }
};

// Proxy object so existing callers (`pool.query(...)`) continue to work
// unchanged, while transparently running ensureTablesCreated() on first use.
const pool = new Proxy({}, {
  get(_target, prop) {
    return async (...args) => {
      await ensureTablesCreated();
      return getPool()[prop](...args);
    };
  },
});

const createTables = async () => {
  const p = getPool();
  await p.query(`
    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
      duration INTEGER NOT NULL CHECK (duration >= 0),
      category TEXT NOT NULL,
      image TEXT DEFAULT '',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      user_name TEXT NOT NULL,
      email TEXT NOT NULL,
      service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(service_id, date, time)
    );
  `);
};

module.exports = { pool, createTables };