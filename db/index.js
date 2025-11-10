import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';
import dotenv from 'dotenv';

dotenv.config();

// Parse DATABASE_URL or use individual env vars
const connectionString = process.env.DATABASE_URL;

let pool;
if (connectionString) {
  pool = new Pool({
    connectionString: connectionString
  });
} else {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Dana1122',
    database: process.env.DB_NAME || 'hrs_db'
  };
  pool = new Pool(dbConfig);
}

export const db = drizzle(pool, { schema });
export { pool };