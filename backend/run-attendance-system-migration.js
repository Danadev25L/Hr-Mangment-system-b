import { db } from './db/index.js';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('🚀 Starting advanced attendance system migration...');
    
    const migrationPath = join(__dirname, 'db', 'migrations', '0020_create_advanced_attendance_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      try {
        console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);
        await db.execute(sql.raw(statements[i]));
      } catch (err) {
        // Ignore "already exists" errors
        if (err.message && err.message.includes('already exists')) {
          console.log(`⚠️  Table/constraint already exists, skipping...`);
        } else {
          console.error(`❌ Error in statement ${i + 1}:`, err.message);
          throw err;
        }
      }
    }
    
    console.log('✅ Advanced attendance system migration completed successfully!');
    console.log('📊 Created tables:');
    console.log('   - work_shifts');
    console.log('   - employee_shifts');
    console.log('   - attendance_policies');
    console.log('   - department_policies');
    console.log('   - break_types');
    console.log('   - attendance_breaks');
    console.log('   - geofence_locations');
    console.log('   - device_whitelist');
    console.log('   - attendance_location_logs');
    console.log('   - biometric_logs');
    console.log('   - overtime_requests');
    console.log('   - overtime_tracking');
    console.log('   - attendance_alerts');
    console.log('   - leave_balances');
    console.log('   - daily_attendance_reports');
    console.log('   - department_attendance_reports');
    console.log('   - attendance_audit_log');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
