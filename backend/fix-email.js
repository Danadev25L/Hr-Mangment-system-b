import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function fixEmail() {
  try {
    console.log('🔧 Fixing admin user email...');

    // Use raw SQL to avoid Drizzle schema issues
    const result = await db.execute(sql`
      UPDATE users
      SET email = 'admin@company.com'
      WHERE username = 'admin'
      RETURNING id, username, email, full_name, role
    `);

    if (result.length > 0) {
      console.log('✅ Admin user email updated successfully:');
      console.log('  ID:', result[0].id);
      console.log('  Username:', result[0].username);
      console.log('  Email:', result[0].email);
      console.log('  Name:', result[0].full_name);
      console.log('  Role:', result[0].role);
    } else {
      console.log('❌ Admin user not found');
    }

    console.log('🎉 Email fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing email:', error.message);
    process.exit(1);
  }
}

fixEmail();