import { db, pool } from './index.js';
import { sql } from 'drizzle-orm';

async function checkNotificationsTable() {
  try {
    console.log('Checking notifications table structure...\n');
    
    // Query to get table columns
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position;
    `);
    
    console.log('Current notifications table columns:');
    console.log('=====================================');
    result.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type}${row.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
    });
    
    // Check if metadata column exists
    const hasMetadata = result.rows.some(row => row.column_name === 'metadata');
    
    if (!hasMetadata) {
      console.log('\n❌ ISSUE FOUND: metadata column does NOT exist in database');
      console.log('   But schema.js includes metadata field');
      console.log('\n🔧 SOLUTION: Run migration to add metadata column');
      console.log('   Execute: node db/run_migration_0014.js');
    } else {
      console.log('\n✅ metadata column exists in database');
    }
    
  } catch (error) {
    console.error('Error checking table:', error.message);
  } finally {
    await pool.end();
  }
}

checkNotificationsTable();
