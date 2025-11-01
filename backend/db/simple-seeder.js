import bcrypt from 'bcrypt';
import { db } from './index.js';
import { users, departments } from './schema.js';

async function seedUsers() {
  try {
    console.log('🌱 Starting user seeding...');

    // Create a default department first
    console.log('Creating default department...');
    const [defaultDept] = await db.insert(departments).values({
      departmentName: 'General',
      isActive: true
    }).returning();

    console.log('✓ Default department created');

    // Seed Users with SECURE passwords
    console.log('Creating users with secure passwords...');

    // Generate secure passwords for each user
    const adminPassword = await bcrypt.hash('Admin@2024!Secure', 10);
    const managerPassword = await bcrypt.hash('Manager@2024!Strong', 10);
    const employeePassword1 = await bcrypt.hash('Employee@2024!John', 10);
    const employeePassword2 = await bcrypt.hash('Employee@2024!Jane', 10);

    await db.insert(users).values([
      {
        username: 'admin',
        password: adminPassword,
        fullName: 'Admin User',
        role: 'ROLE_ADMIN',
        active: true,
        departmentId: defaultDept.id,
        employeeCode: 'ADMIN-001'
      },
      {
        username: 'manager',
        password: managerPassword,
        fullName: 'Mike Johnson',
        role: 'ROLE_MANAGER',
        active: true,
        departmentId: defaultDept.id,
        employeeCode: 'MGR-001'
      },
      {
        username: 'john.doe',
        password: employeePassword1,
        fullName: 'John Doe',
        role: 'ROLE_EMPLOYEE',
        active: true,
        departmentId: defaultDept.id,
        employeeCode: 'EMP-001'
      },
      {
        username: 'jane.smith',
        password: employeePassword2,
        fullName: 'Jane Smith',
        role: 'ROLE_EMPLOYEE',
        active: true,
        departmentId: defaultDept.id,
        employeeCode: 'EMP-002'
      }
    ]);

    console.log('✓ Users created with secure encrypted passwords');
    console.log('\n🔑 Login credentials (SECURE PASSWORDS):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Username: admin      | Password: Admin@2024!Secure      (Admin Role)');
    console.log('Username: manager    | Password: Manager@2024!Strong    (Manager Role)');
    console.log('Username: john.doe   | Password: Employee@2024!John     (Employee Role)');
    console.log('Username: jane.smith | Password: Employee@2024!Jane     (Employee Role)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();