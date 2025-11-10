import { db } from './db/index.js';
import { users, departments } from './db/schema.js';
import bcrypt from 'bcrypt';

async function seed() {
  try {
    console.log('🌱 Starting simple database seeding...\n');

    // Clean existing data
    console.log('🧹 Cleaning existing data...');
    await db.delete(users);
    await db.delete(departments);
    console.log('✅ Existing data cleaned\n');

    // Insert departments
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
    console.log(`✅ Created ${deptResults.length} departments\n`);

    const engineeringDept = deptResults.find(d => d.departmentName === 'Engineering');
    const hrDept = deptResults.find(d => d.departmentName === 'Human Resources');

    // Hash passwords
    console.log('🔐 Hashing passwords...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const managerPassword = await bcrypt.hash('manager123', 10);
    const employeePassword = await bcrypt.hash('employee123', 10);
    console.log('✅ Passwords hashed\n');

    // Insert users with all required fields
    console.log('👥 Creating users...');
    const userResults = await db.insert(users).values([
      {
        username: 'admin',
        password: adminPassword,
        fullName: 'System Administrator',
        employeeCode: 'ADM-0001',
        jobTitle: 'System Admin',
        role: 'ROLE_ADMIN',
        active: true,
        departmentId: null,
        baseSalary: 80000,
        email: 'admin@company.com',
        employmentType: 'Full-time',
        workLocation: 'Office',
        startDate: new Date()
      },
      {
        username: 'manager',
        password: managerPassword,
        fullName: 'John Manager',
        employeeCode: 'MGR-0001',
        jobTitle: 'Engineering Manager',
        role: 'ROLE_MANAGER',
        active: true,
        departmentId: engineeringDept?.id,
        baseSalary: 90000,
        email: 'manager@company.com',
        employmentType: 'Full-time',
        workLocation: 'Office',
        startDate: new Date()
      },
      {
        username: 'john.doe',
        password: employeePassword,
        fullName: 'John Doe',
        employeeCode: 'EMP-0001',
        jobTitle: 'Software Developer',
        role: 'ROLE_EMPLOYEE',
        active: true,
        departmentId: engineeringDept?.id,
        baseSalary: 70000,
        email: 'john.doe@company.com',
        employmentType: 'Full-time',
        workLocation: 'Office',
        startDate: new Date()
      },
      {
        username: 'jane.smith',
        password: employeePassword,
        fullName: 'Jane Smith',
        employeeCode: 'EMP-0002',
        jobTitle: 'HR Specialist',
        role: 'ROLE_EMPLOYEE',
        active: true,
        departmentId: hrDept?.id,
        baseSalary: 65000,
        email: 'jane.smith@company.com',
        employmentType: 'Full-time',
        workLocation: 'Office',
        startDate: new Date()
      }
    ]).returning();

    console.log(`✅ Created ${userResults.length} users\n`);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📊 Summary:');
    console.log(`   • ${deptResults.length} Departments created`);
    console.log(`   • ${userResults.length} Users created\n`);
    
    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Admin:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Role: ROLE_ADMIN\n');
    
    console.log('👤 Manager:');
    console.log('   Username: manager');
    console.log('   Password: manager123');
    console.log('   Role: ROLE_MANAGER\n');
    
    console.log('👤 Employee 1:');
    console.log('   Username: john.doe');
    console.log('   Password: employee123');
    console.log('   Role: ROLE_EMPLOYEE\n');
    
    console.log('👤 Employee 2:');
    console.log('   Username: jane.smith');
    console.log('   Password: employee123');
    console.log('   Role: ROLE_EMPLOYEE\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ You can now start your application and log in!');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    console.error('\nFull error details:', error.message);
    process.exit(1);
  }
}

seed();
