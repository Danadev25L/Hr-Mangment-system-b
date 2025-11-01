import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function addBasicFields() {
  try {
    console.log('Adding basic email field first...');

    // First, add the email field which is required
    try {
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE`);
      console.log('✅ Email column added');
    } catch (error) {
      console.log('Email column already exists or error:', error.message);
    }

    // Add other essential fields one by one
    const fields = [
      'employment_type VARCHAR(50) DEFAULT \'Full-time\'',
      'work_location VARCHAR(255) DEFAULT \'Office\'',
      'start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP',
      'phone VARCHAR(50) NULL',
      'address TEXT NULL',
      'city VARCHAR(255) NULL',
      'country VARCHAR(255) NULL',
      'date_of_birth TIMESTAMP NULL',
      'gender VARCHAR(50) NULL',
      'marital_status VARCHAR(50) NULL',
      'emergency_contact VARCHAR(255) NULL',
      'emergency_phone VARCHAR(50) NULL',
      'skills TEXT NULL',
      'experience TEXT NULL',
      'last_login TIMESTAMP NULL'
    ];

    for (const field of fields) {
      try {
        await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${field}`);
        console.log(`✅ Added field: ${field.split(' ')[0]}`);
      } catch (error) {
        console.log(`Field ${field.split(' ')[0]} already exists or error:`, error.message);
      }
    }

    // Update existing users to have default emails
    try {
      const result = await db.execute(sql`
        UPDATE users
        SET email = username || '@company.com'
        WHERE email IS NULL OR email = ''
      `);
      console.log(`✅ Updated ${result.rowCount} users with default emails`);
    } catch (error) {
      console.log('Error updating emails:', error.message);
    }

    console.log('✅ Database schema updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating database:', error);
    process.exit(1);
  }
}

addBasicFields();