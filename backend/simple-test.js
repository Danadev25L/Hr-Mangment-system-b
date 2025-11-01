import { db } from './db/index.js';
import { users, departments } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function simpleTest() {
  try {
    console.log('🔍 Simple database test...');

    // Try to get departments first (simpler table)
    console.log('\n📁 Checking departments...');
    const allDepts = await db.select().from(departments);
    console.log(`Found ${allDepts.length} departments:`);
    allDepts.forEach(dept => {
      console.log(`  - ${dept.departmentName} (ID: ${dept.id})`);
    });

    // Try to get users
    console.log('\n👥 Checking users...');
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} users:`);
    allUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.role}) - ${user.fullName}`);
    });

    // Look for admin specifically
    console.log('\n🔍 Looking for admin user...');
    const adminUsers = await db.select()
      .from(users)
      .where(eq(users.username, 'admin'));

    if (adminUsers.length > 0) {
      console.log('✅ Found admin user:', adminUsers[0].username);
      console.log('Password hash exists:', !!adminUsers[0].password);
      console.log('Full admin data:', {
        id: adminUsers[0].id,
        username: adminUsers[0].username,
        fullName: adminUsers[0].fullName,
        role: adminUsers[0].role,
        active: adminUsers[0].active,
        departmentId: adminUsers[0].departmentId,
        email: adminUsers[0].email
      });
    } else {
      console.log('❌ Admin user not found');
    }

    console.log('\n✅ Database test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

simpleTest();