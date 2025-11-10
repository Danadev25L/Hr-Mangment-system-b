import { db } from './db/index.js';
import { departments, users } from './db/schema.js';
import { eq, count } from 'drizzle-orm';

async function testDepartmentCounts() {
    try {
        console.log('🔍 Testing department employee counts...\n');

        // Get all departments
        const allDepts = await db.select().from(departments);
        console.log(`📋 Found ${allDepts.length} departments:\n`);

        for (const dept of allDepts) {
            console.log(`\n📌 Department: ${dept.departmentName} (ID: ${dept.id})`);
            
            // Method 1: Count with Drizzle count()
            const countResult = await db.select({ count: count() })
                .from(users)
                .where(eq(users.departmentId, dept.id));
            console.log(`   Method 1 (count): ${countResult[0]?.count || 0}`);

            // Method 2: Select all and get length
            const usersList = await db.select({ id: users.id })
                .from(users)
                .where(eq(users.departmentId, dept.id));
            console.log(`   Method 2 (select): ${usersList.length}`);

            // Method 3: Get actual users with details
            const usersDetails = await db.select({
                id: users.id,
                fullName: users.fullName,
                department: users.department,
                departmentId: users.departmentId
            })
                .from(users)
                .where(eq(users.departmentId, dept.id));
            
            console.log(`   Method 3 (details): ${usersDetails.length} users`);
            if (usersDetails.length > 0) {
                console.log('   Users:');
                usersDetails.forEach(u => {
                    console.log(`     - ${u.fullName} (ID: ${u.id}, Dept: ${u.department}, DeptID: ${u.departmentId})`);
                });
            }
        }

        console.log('\n\n📊 Summary: All users by departmentId:');
        const allUsers = await db.select({
            id: users.id,
            fullName: users.fullName,
            departmentId: users.departmentId,
            department: users.department
        }).from(users);

        console.log(`\nTotal users: ${allUsers.length}`);
        const grouped = allUsers.reduce((acc, user) => {
            const deptId = user.departmentId || 'null';
            if (!acc[deptId]) acc[deptId] = [];
            acc[deptId].push(user);
            return acc;
        }, {});

        for (const [deptId, userList] of Object.entries(grouped)) {
            console.log(`\nDepartment ID ${deptId}: ${userList.length} users`);
            userList.forEach(u => {
                console.log(`  - ${u.fullName} (Dept Name: ${u.department || 'N/A'})`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testDepartmentCounts();
