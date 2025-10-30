import { sql } from 'drizzle-orm';
import { db, pool } from './index.js';

async function completeMigration() {
  console.log('Completing migration: creating new days_holiday table...');
  
  try {
    // Check if the table already exists
    const checkTable = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'days_holiday'
      );
    `);
    
    if (checkTable.rows[0].exists) {
      console.log('✅ days_holiday table already exists!');
      console.log('Migration appears to be complete.');
    } else {
      // Create the new table
      console.log('Creating new days_holiday table...');
      await db.execute(sql`
        CREATE TABLE "days_holiday" (
          "id" serial PRIMARY KEY NOT NULL,
          "date" timestamp NOT NULL,
          "name" varchar(255),
          "description" text,
          "is_recurring" boolean DEFAULT false,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now()
        );
      `);
      
      console.log('Creating index...');
      await db.execute(sql`
        CREATE INDEX "days_holiday_date_idx" ON "days_holiday"("date");
      `);
      
      console.log('✅ Migration completed successfully!');
    }
    
    // Show table structure
    console.log('\nVerifying table structure...');
    const columns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'days_holiday'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nColumns in days_holiday table:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

completeMigration();
