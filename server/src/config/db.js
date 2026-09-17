const { Pool } = require('pg');

const isCloudDb = process.env.NODE_ENV === 'production' || 
                  process.env.VERCEL || 
                  (process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('neon.tech') || process.env.DATABASE_URL.includes('aws')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nexus',
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
