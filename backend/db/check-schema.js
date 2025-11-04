import { sql } from 'drizzle-orm';
import { db, pool } from './index.js';

async function checkSchema() {
  try {
    const result = await db.execute(sql.raw(`
      SELECT column_name, column_default, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'salary_adjustments' 
      AND column_name = 'monthly_salary_id'
    `));
    
    console.log('monthly_salary_id column info:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
