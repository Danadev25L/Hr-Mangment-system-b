import { sql } from 'drizzle-orm';
import { db, pool } from './index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('Running migration 0021: create salary management system...');
  
  try {
    // Check if table exists
    const checkTable = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'salary_adjustments'
      );
    `);
    
    if (checkTable.rows[0].exists) {
      console.log('✅ salary_adjustments table already exists!');
    } else {
      console.log('Creating salary tables...');
      
      // Read the migration SQL file
      const migrationPath = path.join(__dirname, 'migrations', '0021_create_salary_management_system.sql');
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
        await db.execute(sql.raw(statement));
      }
      
      console.log('✅ Salary tables created successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration();
