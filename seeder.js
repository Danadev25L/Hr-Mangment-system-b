import { sql } from 'drizzle-orm';

import { db } from './db/index.js';
import { users, departments, jobs, expenses, payments, daysHoliday, departmentAnnouncements, announcementRecipients, personalInformation } from './db/schema.js';

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clean existing data in correct order (respect foreign key constraints)
    await db.delete(announcementRecipients);
    await db.delete(personalInformation);
    await db.delete(payments);
    await db.delete(expenses);
    await db.delete(departmentAnnouncements);
    await db.delete(users);  // Delete users before jobs (users references jobs)
    await db.delete(jobs);
    await db.delete(departments);
    await db.delete(daysHoliday);
    console.log('🧹 Cleaned existing data');

    // Insert departments
    const deptResults = await db.insert(departments).values([
      {
        departmentName: 'Engineering',
        description: 'Software development and technology',
        isActive: true
      },
      {
        departmentName: 'Human Resources',
        description: 'HR operations and employee management',
        isActive: true
      },
      {
        departmentName: 'Sales',
        description: 'Sales and business development',
        isActive: true
      }
    ]).returning();

    console.log('✅ Departments created:', deptResults.length);

    // Get department IDs
    const engineeringDept = deptResults.find(d => d.departmentName === 'Engineering');
    const hrDept = deptResults.find(d => d.departmentName === 'Human Resources');

    // Hash passwords manually (simple approach for seeder)
    const bcrypt = await import('bcrypt');

    const adminPassword = await bcrypt.hash('admin123', 10);
    const managerPassword = await bcrypt.hash('manager123', 10);
    const employeePassword = await bcrypt.hash('employee123', 10);

    // Insert users
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
        employmentType: 'Full-time',
        workLocation: 'Office'
      },
      {
        username: 'manager',
        password: managerPassword,
        fullName: 'John Manager',
        employeeCode: 'EMP002',
        jobTitle: 'Engineering Manager',
        role: 'ROLE_MANAGER',
        active: true,
        departmentId: engineeringDept?.id || 1,
        baseSalary: 90000,
        email: 'manager@company.com',
        employmentType: 'Full-time',
        workLocation: 'Office'
      },
      {
        username: 'john.doe',
        password: employeePassword,
        fullName: 'John Doe',
        employeeCode: 'EMP003',
        jobTitle: 'Software Developer',
        role: 'ROLE_EMPLOYEE',
        active: true,
        departmentId: engineeringDept?.id || 1,
        baseSalary: 70000,
        email: 'john.doe@company.com',
        employmentType: 'Full-time',
        workLocation: 'Office'
      },
      {
        username: 'jane.smith',
        password: employeePassword,
        fullName: 'Jane Smith',
        employeeCode: 'EMP004',
        jobTitle: 'HR Specialist',
        role: 'ROLE_EMPLOYEE',
        active: true,
        departmentId: hrDept?.id || 2,
        baseSalary: 65000,
        email: 'jane.smith@company.com',
        employmentType: 'Full-time',
        workLocation: 'Office'
      }
    ]).returning();

    console.log('✅ Users created:', userResults.length);
    console.log('👤 Admin:', { username: 'admin', password: 'admin123' });
    console.log('👤 Manager:', { username: 'manager', password: 'manager123' });
    console.log('👤 Employee 1:', { username: 'john.doe', password: 'employee123' });
    console.log('👤 Employee 2:', { username: 'jane.smith', password: 'employee123' });

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seed();