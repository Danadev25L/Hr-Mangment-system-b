import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function checkTable() {
  try {
    console.log('🔍 Checking actual database table structure...');

    // Get actual table structure
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Actual users table structure:');
    if (result && result.length > 0) {
      result.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable}) ${col.column_default ? `[${col.column_default}]` : ''}`);
      });
    } else {
      console.log('No columns found or table does not exist');
    }

    // Check if email column exists
    const emailColumn = result?.find(col => col.column_name === 'email');
    console.log(`\n📧 Email column exists: ${!!emailColumn}`);
    if (emailColumn) {
      console.log(`   Type: ${emailColumn.data_type}`);
      console.log(`   Nullable: ${emailColumn.is_nullable}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking table:', error.message);
    process.exit(1);
  }
}

checkTable();