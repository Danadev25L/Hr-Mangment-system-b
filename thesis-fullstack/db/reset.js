import { pool } from './index.js';

async function dropAllTables() {
  console.log('🗑️  Dropping all tables...');
  
  try {
    const client = await pool.connect();
    
    try {
      // Drop all tables in the public schema
      await client.query(`
        DROP SCHEMA public CASCADE;
        CREATE SCHEMA public;
        GRANT ALL ON SCHEMA public TO postgres;
        GRANT ALL ON SCHEMA public TO public;
      `);
      
      console.log('✅ All tables dropped successfully');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error dropping tables:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

dropAllTables();
