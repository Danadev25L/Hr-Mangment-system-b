import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function addMissingColumns() {
  try {
    console.log('Adding missing columns to users table...');

    const columns = [
      'employment_type VARCHAR(50) DEFAULT \'Full-time\'',
      'work_location VARCHAR(255) DEFAULT \'Office\'',
      'start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP',
      'end_date TIMESTAMP NULL',
      'probation_end TIMESTAMP NULL',
      'email VARCHAR(255) NOT NULL DEFAULT \'\', UNIQUE (email)',
      'phone VARCHAR(50) NULL',
      'address TEXT NULL',
      'city VARCHAR(255) NULL',
      'country VARCHAR(255) NULL',
      'date_of_birth TIMESTAMP NULL',
      'gender VARCHAR(50) NULL',
      'marital_status VARCHAR(50) NULL',
      'emergency_contact VARCHAR(255) NULL',
      'emergency_phone VARCHAR(50) NULL',
      'manager_id INTEGER NULL',
      'reports_to VARCHAR(255) NULL',
      'skills TEXT NULL',
      'experience TEXT NULL',
      'last_login TIMESTAMP NULL'
    ];

    for (const column of columns) {
      try {
        const columnName = column.split(' ')[0];
        await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${sql.raw(column)}`);
        console.log(`✅ Added column: ${columnName}`);
      } catch (error) {
        const columnName = column.split(' ')[0];
        console.log(`⚠️ Column ${columnName} already exists or error: ${error.message}`);
      }
    }

    // Update existing users to have default values
    const result = await db.execute(sql`
      UPDATE users
      SET
        email = CASE WHEN email IS NULL OR email = '' THEN username || '@company.com' ELSE email END,
        employment_type = CASE WHEN employment_type IS NULL THEN 'Full-time' ELSE employment_type END,
        work_location = CASE WHEN work_location IS NULL THEN 'Office' ELSE work_location END,
        start_date = CASE WHEN start_date IS NULL THEN CURRENT_TIMESTAMP ELSE start_date END
      WHERE username IN ('admin', 'manager', 'john.doe', 'jane.smith')
    `);

    console.log('✅ Updated existing users with default values');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addMissingColumns();