import { db } from './db/index.js';
import { users } from './db/schema.js';
import { sql } from 'drizzle-orm';

async function testDB() {
  try {
    console.log('🔍 Testing database connection and user structure...');

    // Check if we can connect to database
    const result = await db.execute(sql`SELECT NOW() as current_time`);
    console.log('✅ Database connected:', result[0]?.current_time);

    // Check user table structure
    const tableInfo = await db.execute(sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Users table structure:');
    tableInfo.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });

    // Check existing users
    const existingUsers = await db.select().from(users).limit(5);
    console.log('\n👥 Existing users:');
    existingUsers.forEach(user => {
      console.log(`  ID: ${user.id}, Username: ${user.username}, Role: ${user.role}`);
    });

    // Try to find admin user specifically
    const adminUser = await db.select()
      .from(users)
      .where(sql`username = 'admin'`);

    console.log('\n🔍 Admin user details:');
    if (adminUser.length > 0) {
      console.log(adminUser[0]);
    } else {
      console.log('Admin user not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
}

testDB();