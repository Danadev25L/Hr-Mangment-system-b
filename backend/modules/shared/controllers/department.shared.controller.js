import { db } from '../../../db/index.js';
import { departments, users } from '../../../db/schema.js';
import { eq, count } from 'drizzle-orm';

// Get all departments (available to all authenticated users for reference)
export const getAllDepartments = async (req, res) => {
  try {
    console.log('📊 [Shared] Getting all departments with user counts...');
    
    const allDepartments = await db.select({
      id: departments.id,
      departmentName: departments.departmentName,
      name: departments.departmentName, // Alias for compatibility
      isActive: departments.isActive,
      createdAt: departments.createdAt,
      updatedAt: departments.updatedAt,
    })
    .from(departments);

    console.log(`📋 [Shared] Found ${allDepartments.length} departments`);

    // Get user counts and users for each department
    const departmentsWithCount = await Promise.all(
      allDepartments.map(async (dept) => {
        console.log(`🔍 [Shared] Processing department: ${dept.departmentName} (ID: ${dept.id})`);
        
        // Get count
        const userCount = await db.select({ count: count() })
          .from(users)
          .where(eq(users.departmentId, dept.id));

        const totalCount = userCount[0]?.count || 0;
        console.log(`   👥 Total users: ${totalCount}`);

        // Get users (limited to first few for display)
        const departmentUsers = await db.select({
          id: users.id,
          username: users.username,
          fullName: users.fullName
        })
          .from(users)
          .where(eq(users.departmentId, dept.id))
          .limit(5);

        console.log(`   📝 Fetched ${departmentUsers.length} users for display`);

        return {
          ...dept,
          employeeCount: totalCount,
          users: departmentUsers
        };
      })
    );

    console.log('✅ [Shared] Returning departments with counts');
    res.json(departmentsWithCount);
  } catch (error) {
    console.error('❌ [Shared] Error fetching departments:', error);
    res.status(500).json({
      message: 'Error retrieving departments'
    });
  }
};
