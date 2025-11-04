import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, pool } from './index.js';
import { sql } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('Starting migration 0014...\n');
    
    const migrationPath = path.join(__dirname, 'migrations', '0014_add_metadata_to_notifications.sql');
    if (!fs.existsSync(migrationPath)) {
      console.error('Migration file not found:', migrationPath);
      await pool.end();
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Remove SQL comments and split statements
    const cleanSQL = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    const statements = cleanSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Found ${statements.length} statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`[${i + 1}/${statements.length}] Executing: ${stmt.substring(0, 60)}...`);
      try {
        await db.execute(sql.raw(stmt));
        console.log(`✓ Statement ${i + 1} completed successfully`);
      } catch (error) {
        console.error(`✗ Error on statement ${i + 1}:`, error.message);
        throw error;
      }
    }

    console.log('\n✅ Migration 0014 applied successfully!');
    console.log('   - Added metadata JSONB column to notifications');
    console.log('   - Created indexes for better query performance\n');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error applying migration 0014:', error.message);
    try { await pool.end(); } catch (e) {}
    process.exit(1);
  }
}

runMigration();
