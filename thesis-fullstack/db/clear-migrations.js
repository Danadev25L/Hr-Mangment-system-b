import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new pg.Client(process.env.DATABASE_URL);

async function clearMigrations() {
  try {
    await client.connect();
    console.log('🗑️  Dropping drizzle migrations tracking table...');
    await client.query('DROP TABLE IF EXISTS __drizzle_migrations CASCADE');
    console.log('✅ Drizzle migrations table dropped');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

clearMigrations();
