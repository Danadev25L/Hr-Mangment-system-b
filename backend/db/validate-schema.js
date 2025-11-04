import { db, pool } from './index.js';
import { sql } from 'drizzle-orm';

async function validateSchemaRelations() {
  try {
    console.log('🔍 Validating database schema and relations...\n');
    
    const checks = [
      {
        name: 'Foreign key constraints',
        query: `
          SELECT
            tc.table_name as table_name,
            kcu.column_name as column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY'
          ORDER BY tc.table_name, kcu.column_name;
        `
      },
      {
        name: 'Tables with missing indexes',
        query: `
          SELECT tablename, indexname 
          FROM pg_indexes 
          WHERE schemaname = 'public' 
          ORDER BY tablename, indexname;
        `
      }
    ];
    
    // Check 1: Verify all critical tables exist
    console.log('✓ Checking critical tables exist...');
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    const criticalTables = [
      'users', 'department', 'notifications', 'applications', 
      'expenses', 'attendance_records', 'salary_records',
      'payroll_records', 'jobs', 'department_announcement'
    ];
    
    const existingTables = tables.rows.map(r => r.table_name);
    const missingTables = criticalTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length > 0) {
      console.log(`  ❌ Missing tables: ${missingTables.join(', ')}`);
    } else {
      console.log(`  ✅ All critical tables exist (${existingTables.length} tables total)`);
    }
    
    // Check 2: Verify foreign key constraints
    console.log('\n✓ Checking foreign key constraints...');
    const fkResult = await db.execute(sql.raw(checks[0].query));
    console.log(`  ✅ Found ${fkResult.rows.length} foreign key constraints`);
    
    // Check specific important foreign keys
    const importantFKs = [
      { table: 'notifications', column: 'user_id', references: 'users' },
      { table: 'applications', column: 'user_id', references: 'users' },
      { table: 'expenses', column: 'user_id', references: 'users' },
      { table: 'users', column: 'department_id', references: 'department' }
    ];
    
    for (const fk of importantFKs) {
      const found = fkResult.rows.some(r => 
        r.table_name === fk.table && 
        r.column_name === fk.column && 
        r.foreign_table_name === fk.references
      );
      
      if (found) {
        console.log(`  ✓ ${fk.table}.${fk.column} → ${fk.references}`);
      } else {
        console.log(`  ⚠️  Missing FK: ${fk.table}.${fk.column} → ${fk.references}`);
      }
    }
    
    // Check 3: Verify notifications table structure
    console.log('\n✓ Checking notifications table...');
    const notifColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position;
    `);
    
    const requiredColumns = ['id', 'user_id', 'title', 'message', 'type', 'metadata', 'is_read'];
    const hasAllColumns = requiredColumns.every(col => 
      notifColumns.rows.some(r => r.column_name === col)
    );
    
    if (hasAllColumns) {
      console.log(`  ✅ Notifications table has all required columns`);
    } else {
      console.log(`  ❌ Notifications table is missing some columns`);
    }
    
    // Check 4: Verify indexes on notifications
    console.log('\n✓ Checking notifications indexes...');
    const notifIndexes = await db.execute(sql`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'notifications'
      ORDER BY indexname;
    `);
    
    console.log(`  ✅ Found ${notifIndexes.rows.length} indexes on notifications table:`);
    notifIndexes.rows.forEach(idx => {
      console.log(`     - ${idx.indexname}`);
    });
    
    console.log('\n✅ Schema validation completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Validation error:', error.message);
  } finally {
    await pool.end();
  }
}

validateSchemaRelations();
