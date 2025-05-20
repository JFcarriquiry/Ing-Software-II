console.log('--- UNIQUE MARKER V4 --- THIS IS backend/src/db/index.ts --- TOP ---');
import { Pool } from 'pg';

console.log('--- DB MODULE STARTED --- UNIQUE MARKER V4 ---');

const config = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

console.log(`[DB_CONFIG V4] Raw env vars: DB_HOST=${process.env.DB_HOST}, DB_PORT=${process.env.DB_PORT}, DB_NAME=${process.env.DB_NAME}, DB_USER=${process.env.DB_USER}`);
console.log(`[DB_CONFIG V4] Parsed port for Pool: ${config.port ? parseInt(config.port, 10) : 'undefined -> default 5432'}`);
console.log(`[DB_CONFIG V4] Pool will use: host=${config.host || 'db'}, port=${config.port ? parseInt(config.port, 10) : 5432}, database=${config.database || 'restaurant_reservations_fallback_in_code'}, user=${config.user || 'postgres'}`);

export const db = new Pool({
  host: config.host || 'db',
  port: config.port ? parseInt(config.port, 10) : 5432,
  database: config.database || 'restaurant_reservations_fallback_in_code', // Fallback just in case
  user: config.user || 'postgres',
  password: config.password || 'postgres'
});

console.log('--- DB MODULE Pool INSTANTIATED --- UNIQUE MARKER V4 ---'); 