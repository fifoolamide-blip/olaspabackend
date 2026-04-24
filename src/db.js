const { Pool } = require('pg');

// DATABASE_URL may be a Railway reference variable placeholder (e.g. "${{ Postgres.DATABASE_URL }}")
// at module-load time if the dependent service hasn't resolved it yet. Using a lazy-loaded pool
// ensures the variable is read only when the first query is made, by which point Railway will
// have expanded it to the real connection string.
let _pool = null;

const getPool = () => {
  if (_pool) return _pool;

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Ensure the Postgres service is linked to this service in Railway.');
  }

  if (connectionString.includes('${{')) {
    throw new Error(
      `DATABASE_URL contains an unresolved Railway reference variable: "${connectionString}". ` +
      'Ensure the Postgres service is deployed and the variable reference is correct.'
    );
  }

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

// Proxy object so existing callers (`pool.query(...)`) continue to work unchanged.
const pool = new Proxy({}, {
  get(_target, prop) {
    return (...args) => getPool()[prop](...args);
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