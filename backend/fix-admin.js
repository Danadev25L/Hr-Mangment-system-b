import { db } from './db/index.js';
import { users } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function fixAdmin() {
  try {
    console.log('🔧 Fixing admin user...');

    // Update admin user with missing required fields
    const result = await db.update(users)
      .set({
        email: 'admin@company.com',
        fullName: 'System Administrator',
        employeeCode: 'EMP001',
        jobTitle: 'System Admin',
        startDate: new Date()
      })
      .where(eq(users.username, 'admin'))
      .returning();

    if (result.length > 0) {
      console.log('✅ Admin user updated successfully:');
      console.log('  Username:', result[0].username);
      console.log('  Email:', result[0].email);
      console.log('  Full Name:', result[0].fullName);
      console.log('  Role:', result[0].role);
    } else {
      console.log('❌ Admin user not found');
    }

    console.log('🎉 Admin fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing admin:', error.message);
    process.exit(1);
  }
}

fixAdmin();