const { Pool } = require('pg');

const DEFAULT_NEON_URL = 'postgresql://neondb_owner:npg_bTxGUCRW81Yn@ep-floral-forest-aztubiqy-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const connectionString = process.env.DATABASE_URL || DEFAULT_NEON_URL;
const isCloudDb = connectionString.includes('neon.tech') || connectionString.includes('aws') || process.env.NODE_ENV === 'production' || process.env.VERCEL;

const pool = new Pool({
  connectionString,
  ssl: isCloudDb ? { rejectUnauthorized: false } : false
});

pool.query('SELECT 1', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected');
  }
});

pool.pool = pool;

module.exports = pool;
