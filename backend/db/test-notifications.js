import { db, pool } from './index.js';
import { notifications, users } from './schema.js';
import { eq } from 'drizzle-orm';

async function testNotificationInsert() {
  try {
    console.log('Testing notification insert with metadata...\n');
    
    // Get a test user
    const testUser = await db.select()
      .from(users)
      .limit(1);
    
    if (testUser.length === 0) {
      console.error('No users found in database. Cannot test.');
      await pool.end();
      return;
    }
    
    const userId = testUser[0].id;
    console.log(`Using test user ID: ${userId} (${testUser[0].fullName})`);
    
    // Test 1: Insert without metadata
    console.log('\n[Test 1] Inserting notification WITHOUT metadata...');
    const [notif1] = await db.insert(notifications)
      .values({
        userId: userId,
        title: 'Test Notification 1',
        message: 'This is a test notification without metadata',
        type: 'info',
        relatedId: null,
        isRead: false
      })
      .returning();
    
    console.log('✅ Success! Notification ID:', notif1.id);
    
    // Test 2: Insert with metadata
    console.log('\n[Test 2] Inserting notification WITH metadata...');
    const [notif2] = await db.insert(notifications)
      .values({
        userId: userId,
        title: 'Test Notification 2',
        message: 'This is a test notification with metadata',
        type: 'info',
        relatedId: 123,
        metadata: JSON.stringify({ 
          testKey: 'testValue', 
          amount: 1000,
          date: new Date().toISOString()
        }),
        isRead: false
      })
      .returning();
    
    console.log('✅ Success! Notification ID:', notif2.id);
    console.log('   Metadata:', notif2.metadata);
    
    // Test 3: Bulk insert (like announcements do)
    console.log('\n[Test 3] Bulk inserting multiple notifications...');
    const bulkData = [
      {
        userId: userId,
        title: 'Bulk Test 1',
        message: 'First bulk notification',
        type: 'announcement',
        relatedId: 99,
        isRead: false
      },
      {
        userId: userId,
        title: 'Bulk Test 2',
        message: 'Second bulk notification',
        type: 'announcement',
        relatedId: 99,
        isRead: false
      }
    ];
    
    const bulkResult = await db.insert(notifications)
      .values(bulkData)
      .returning();
    
    console.log(`✅ Success! Inserted ${bulkResult.length} notifications`);
    
    // Cleanup test notifications
    console.log('\n[Cleanup] Removing test notifications...');
    await db.delete(notifications)
      .where(eq(notifications.id, notif1.id));
    await db.delete(notifications)
      .where(eq(notifications.id, notif2.id));
    for (const notif of bulkResult) {
      await db.delete(notifications)
        .where(eq(notifications.id, notif.id));
    }
    console.log('✅ Test notifications cleaned up');
    
    console.log('\n🎉 All tests passed! Notifications system is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

testNotificationInsert();
