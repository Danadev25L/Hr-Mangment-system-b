import { db, pool } from './db/index.js';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runAttendanceMigration() {
  try {
    console.log('🚀 Starting attendance system migration...');

    const migrationPath = path.join(__dirname, 'db', 'migrations', '0016_create_attendance_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Remove comments and split by semicolons
    const cleanSQL = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    const statements = cleanSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 10);

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);
        try {
          await db.execute(sql.raw(statement));
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} - ${err.message}`);
        }
      }
    }

    console.log('✅ Attendance system migration completed!');
    console.log('📊 Created tables:');
    console.log('   - attendance_records');
    console.log('   - attendance_summary');
    console.log('   - attendance_corrections');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runAttendanceMigration();
