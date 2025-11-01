import { db } from './db/index.js';
import { users } from './db/schema.js';
import { eq, sql } from 'drizzle-orm';

async function fixEmails() {
  try {
    console.log('Checking users without email...');

    // Get users without email
    const usersWithoutEmail = await db.select()
      .from(users)
      .where(sql`email IS NULL OR email = ''`);

    console.log('Found users without email:', usersWithoutEmail.length);

    if (usersWithoutEmail.length > 0) {
      console.log('Updating users with default emails...');
      for (const user of usersWithoutEmail) {
        const defaultEmail = `${user.username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@company.com`;
        await db.update(users)
          .set({ email: defaultEmail })
          .where(eq(users.id, user.id));
        console.log(`Updated ${user.username} with email: ${defaultEmail}`);
      }
      console.log('✅ Email fixes completed');
    } else {
      console.log('✅ All users have emails');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing emails:', error);
    process.exit(1);
  }
}

fixEmails();