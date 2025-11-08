import { db } from './db/index.js';
import { 
  users, 
  personalInformation,
  organizations,
  departments,
  jobs,
  departmentAnnouncements,
  announcementRecipients,
  expenses,
  payments,
  daysHoliday,
  daysWorking,
  personalEvents,
  messages,
  applications
} from './db/schema.js';

async function resetDatabase() {
  try {
    console.log('🗑️  Starting database cleanup...\n');

    // Delete in reverse order of dependencies
    console.log('Deleting announcement recipients...');
    await db.delete(announcementRecipients);
    
    console.log('Deleting department announcements...');
    await db.delete(departmentAnnouncements);
    
    console.log('Deleting applications...');
    await db.delete(applications);
    
    console.log('Deleting messages...');
    await db.delete(messages);
    
    console.log('Deleting personal events...');
    await db.delete(personalEvents);
    
    console.log('Deleting days working...');
    await db.delete(daysWorking);
    
    console.log('Deleting days holiday...');
    await db.delete(daysHoliday);
    
    console.log('Deleting payments...');
    await db.delete(payments);
    
    console.log('Deleting expenses...');
    await db.delete(expenses);
    
    console.log('Deleting personal information...');
    await db.delete(personalInformation);
    
    console.log('Deleting jobs...');
    await db.delete(jobs);
    
    console.log('Deleting users...');
    await db.delete(users);
    
    console.log('Deleting departments...');
    await db.delete(departments);
    
    console.log('Deleting organizations...');
    await db.delete(organizations);

    console.log('\n✅ Database cleaned successfully!\n');

    // Now run the seed
    console.log('🌱 Running seed.js...\n');
    const seedModule = await import('./db/seed.js');
    
    console.log('\n✅ Database reset and seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetDatabase();
