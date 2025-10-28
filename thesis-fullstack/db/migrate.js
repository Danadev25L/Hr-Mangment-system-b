import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './index.js';

async function runMigration() {
  console.log('Running migrations...');
  
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
  } finally {
    await pool.end();
  }
}

runMigration();