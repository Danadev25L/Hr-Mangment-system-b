import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding...\n');

    await client.query('BEGIN');

    // Clean existing data
    console.log('🧹 Cleaning existing data...');
    await client.query('DELETE FROM users');
    await client.query('DELETE FROM department');
    console.log('✅ Existing data cleaned\n');

    // Insert departments
    console.log('📁 Creating departments...');
    const deptResult = await client.query(`
      INSERT INTO department (department_name, is_active)
      VALUES 
        ('Engineering', true),
        ('Human Resources', true),
        ('Sales', true)
      RETURNING id, department_name
    `);
    console.log(`✅ Created ${deptResult.rows.length} departments\n`);

    const engineeringDept = deptResult.rows.find(d => d.department_name === 'Engineering');
    const hrDept = deptResult.rows.find(d => d.department_name === 'Human Resources');

    // Hash passwords
    console.log('🔐 Hashing passwords...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const managerPassword = await bcrypt.hash('manager123', 10);
    const employeePassword = await bcrypt.hash('employee123', 10);
    console.log('✅ Passwords hashed\n');

    // Insert users
    console.log('👥 Creating users...');
    const userResult = await client.query(`
      INSERT INTO users (username, password, full_name, employee_code, role, active, department_id)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7),
        ($8, $9, $10, $11, $12, $13, $14),
        ($15, $16, $17, $18, $19, $20, $21),
        ($22, $23, $24, $25, $26, $27, $28)
      RETURNING id, username, full_name, employee_code, role
    `, [
      'admin', adminPassword, 'System Administrator', 'ADM-0001', 'ROLE_ADMIN', true, null,
      'manager', managerPassword, 'John Manager', 'MGR-0001', 'ROLE_MANAGER', true, engineeringDept.id,
      'john.doe', employeePassword, 'John Doe', 'EMP-0001', 'ROLE_EMPLOYEE', true, engineeringDept.id,
      'jane.smith', employeePassword, 'Jane Smith', 'EMP-0002', 'ROLE_EMPLOYEE', true, hrDept.id
    ]);

    console.log(`✅ Created ${userResult.rows.length} users\n`);

    await client.query('COMMIT');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📊 Summary:');
    console.log(`   • ${deptResult.rows.length} Departments created`);
    console.log(`   • ${userResult.rows.length} Users created\n`);
    
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

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error during seeding:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
