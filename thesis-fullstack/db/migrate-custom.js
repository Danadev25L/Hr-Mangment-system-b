import { sql } from 'drizzle-orm';
import { db, pool } from './index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runCustomMigration() {
  console.log('Running custom migration: alter days_holiday table...');
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', '0012_alter_days_holiday_for_public_holidays.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    // Remove comments and split into statements
    const cleanSQL = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');
    
    const statements = cleanSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 10);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      console.log(statement.substring(0, 50) + '...');
      await db.execute(sql.raw(statement));
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('The old days_holiday table has been renamed to: days_holiday_old_leave_requests');
    console.log('A new days_holiday table has been created for public holidays');
    
  } catch (error) {
    console.error('❌ Error running migration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runCustomMigration();
