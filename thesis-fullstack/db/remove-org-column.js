import { sql } from 'drizzle-orm';
import { db, pool } from './index.js';

async function removeOrganizationColumn() {
  console.log('Removing organization_id column from days_holiday table...');
  
  try {
    // Drop the foreign key constraint first (if it exists)
    await db.execute(sql`
      ALTER TABLE "days_holiday" 
      DROP CONSTRAINT IF EXISTS "days_holiday_organization_id_organizations_id_fk";
    `);
    
    // Drop the column
    await db.execute(sql`
      ALTER TABLE "days_holiday" 
      DROP COLUMN IF EXISTS "organization_id";
    `);
    
    console.log('✅ organization_id column removed successfully!');
    
    // Verify
    const columns = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'days_holiday'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nCurrent columns in days_holiday table:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

removeOrganizationColumn();
