import { db } from './db/index.js';
import { users, departments } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function simpleSeed() {
  try {
    console.log('🌱 Starting simple user seeding...');

    // Check if admin already exists
    const existingAdmin = await db.select()
      .from(users)
      .where(eq(users.username, 'admin'))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log('✅ Admin user already exists, skipping seeding');
      console.log('👤 Admin:', { username: 'admin', password: 'admin123' });
      process.exit(0);
    }

    // Get or create departments
    let engineeringDept, hrDept;

    const existingDepts = await db.select().from(departments);

    if (existingDepts.length === 0) {
      console.log('📁 Creating departments...');
      const deptResults = await db.insert(departments).values([
        {
          departmentName: 'Engineering',
          isActive: true
        },
        {
          departmentName: 'Human Resources',
          isActive: true
        },
        {
          departmentName: 'Sales',
          isActive: true
        }
      ]).returning();

      console.log('✅ Departments created:', deptResults.length);
      engineeringDept = deptResults.find(d => d.departmentName === 'Engineering');
      hrDept = deptResults.find(d => d.departmentName === 'Human Resources');
    } else {
      console.log('✅ Using existing departments');
      engineeringDept = existingDepts.find(d => d.departmentName === 'Engineering') || existingDepts[0];
      hrDept = existingDepts.find(d => d.departmentName === 'Human Resources') || existingDepts[1];
    }

    // Hash passwords
    const bcrypt = await import('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const managerPassword = await bcrypt.hash('manager123', 10);
    const employeePassword = await bcrypt.hash('employee123', 10);

    // Insert users
    console.log('👥 Creating users...');
    const userResults = await db.insert(users).values([
      {
        username: 'admin',
        password: adminPassword,
        fullName: 'System Administrator',
        employeeCode: 'EMP001',
        jobTitle: 'System Admin',
        role: 'ROLE_ADMIN',
        active: true,
        departmentId: null, // Admin has no department
        baseSalary: 80000,
        email: 'admin@company.com',
        startDate: new Date().toISOString()
      },
      {
        username: 'manager',
        password: managerPassword,
        fullName: 'John Manager',
        employeeCode: 'EMP002',
        jobTitle: 'Engineering Manager',
        role: 'ROLE_MANAGER',
        active: true,
        departmentId: engineeringDept?.id,
        baseSalary: 90000,
        email: 'manager@company.com',
        startDate: new Date().toISOString()
      },
      {
        username: 'john.doe',
        password: employeePassword,
        fullName: 'John Doe',
        employeeCode: 'EMP003',
        jobTitle: 'Software Developer',
        role: 'ROLE_EMPLOYEE',
        active: true,
        departmentId: engineeringDept?.id,
        baseSalary: 70000,
        email: 'john.doe@company.com',
        startDate: new Date().toISOString()
      },
      {
        username: 'jane.smith',
        password: employeePassword,
        fullName: 'Jane Smith',
        employeeCode: 'EMP004',
        jobTitle: 'HR Specialist',
        role: 'ROLE_EMPLOYEE',
        active: true,
        departmentId: hrDept?.id,
        baseSalary: 65000,
        email: 'jane.smith@company.com',
        startDate: new Date().toISOString()
      }
    ]).returning();

    console.log('✅ Users created:', userResults.length);
    console.log('👤 Admin:', { username: 'admin', password: 'admin123' });
    console.log('👤 Manager:', { username: 'manager', password: 'manager123' });
    console.log('👤 Employee 1:', { username: 'john.doe', password: 'employee123' });
    console.log('👤 Employee 2:', { username: 'jane.smith', password: 'employee123' });

    console.log('🎉 Simple seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

simpleSeed();