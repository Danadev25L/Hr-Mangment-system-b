import bcrypt from 'bcrypt';

import { eq } from 'drizzle-orm';

import { generateEmployeeCode } from '../utils/employeeCodeGenerator.js';

import { db } from './index.js';
import { 
  departments, 
  jobs, 
  users, 
  personalInformation,
  departmentAnnouncements,
  announcementRecipients,
  expenses,
  payments,
  daysHoliday,
  daysWorking,
  personalEvents,
  messages,
  applications
} from './schema.js';

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    // Seed Departments
    console.log('Creating departments...');
    const [dept1, dept2, dept3, dept4, dept5] = await db.insert(departments).values([
      {
        departmentName: 'Human Resources',
        isActive: true
      },
      {
        departmentName: 'Engineering',
        isActive: true
      },
      {
        departmentName: 'Finance',
        isActive: true
      },
      {
        departmentName: 'Marketing',
        isActive: true
      },
      {
        departmentName: 'Sales',
        isActive: true
      }
    ]).returning();

    console.log('✓ Departments created');

    // Seed Jobs
    console.log('Creating jobs...');
    const [job1, job2, job3, job4, job5, job6, job7, job8] = await db.insert(jobs).values([
      {
        jobTitle: 'HR Manager',
        startDate: new Date('2024-01-01'),
        description: 'Manage human resources department',
        isActive: true,
        salary: 45000
      },
      {
        jobTitle: 'Engineering Manager',
        startDate: new Date('2024-01-15'),
        description: 'Lead and manage the engineering team',
        isActive: true,
        salary: 65000
      },
      {
        jobTitle: 'Software Engineer',
        startDate: new Date('2024-02-01'),
        description: 'Develop and maintain software applications',
        isActive: true,
        salary: 55000
      },
      {
        jobTitle: 'Accountant',
        startDate: new Date('2024-03-01'),
        description: 'Handle financial records and reporting',
        isActive: true,
        salary: 40000
      },
      {
        jobTitle: 'Marketing Manager',
        startDate: new Date('2024-02-15'),
        description: 'Lead marketing campaigns and strategies',
        isActive: true,
        salary: 50000
      },
      {
        jobTitle: 'Sales Representative',
        startDate: new Date('2024-03-10'),
        description: 'Drive sales and customer relationships',
        isActive: true,
        salary: 35000
      },
      {
        jobTitle: 'Senior Developer',
        startDate: new Date('2024-01-20'),
        description: 'Senior software development role',
        isActive: true,
        salary: 70000
      },
      {
        jobTitle: 'HR Specialist',
        startDate: new Date('2024-02-20'),
        description: 'HR operations and employee relations',
        isActive: true,
        salary: 38000
      }
    ]).returning();

    console.log('✓ Jobs created');

    // Seed Users with SECURE passwords
    console.log('Creating users with secure passwords...');
    
    // Generate secure passwords for each user
    const adminPassword = await bcrypt.hash('Admin@2024!Secure', 10);
    const managerPassword = await bcrypt.hash('Manager@2024!Strong', 10);
    const employeePassword1 = await bcrypt.hash('Employee@2024!John', 10);
    const employeePassword2 = await bcrypt.hash('Employee@2024!Jane', 10);
    const employeePassword3 = await bcrypt.hash('Employee@2024!Sarah', 10);
    const employeePassword4 = await bcrypt.hash('Employee@2024!Mike', 10);
    const employeePassword5 = await bcrypt.hash('Employee@2024!David', 10);
    const employeePassword6 = await bcrypt.hash('Employee@2024!Emma', 10);
    
    // Generate employee codes for each user
    const adminCode = await generateEmployeeCode('ROLE_ADMIN');
    const managerCode = await generateEmployeeCode('ROLE_MANAGER');
    const employeeCode1 = await generateEmployeeCode('ROLE_EMPLOYEE');
    const employeeCode2 = await generateEmployeeCode('ROLE_EMPLOYEE');
    const employeeCode3 = await generateEmployeeCode('ROLE_EMPLOYEE');
    const employeeCode4 = await generateEmployeeCode('ROLE_EMPLOYEE');
    const employeeCode5 = await generateEmployeeCode('ROLE_EMPLOYEE');
    const employeeCode6 = await generateEmployeeCode('ROLE_EMPLOYEE');

    const [admin, manager, user1, user2, user3, user4, user5, user6] = await db.insert(users).values([
      {
        username: 'admin',
        password: adminPassword,
        fullName: 'Admin User',
        employeeCode: adminCode,
        role: 'ROLE_ADMIN',
        active: true,
        departmentId: dept1.id,
        jobId: job1.id
      },
      {
        username: 'manager',
        password: managerPassword,
        fullName: 'Mike Johnson',
        employeeCode: managerCode,
        role: 'ROLE_MANAGER',
        active: true,
        departmentId: dept2.id,
        jobId: job2.id
      },
      {
        username: 'john.doe',
        password: employeePassword1,
        fullName: 'John Doe',
        employeeCode: employeeCode1,
        role: 'ROLE_EMPLOYEE',
        active: true,
        departmentId: dept2.id,
        jobId: job3.id
      },
      {
        username: 'jane.smith',
        password: employeePassword2,
        fullName: 'Jane Smith',
        employeeCode: employeeCode2,
        role: 'ROLE_EMPLOYEE',
        active: true,
        departmentId: dept3.id,
        jobId: job4.id
      },
      {
        username: 'sarah.williams',
        password: employeePassword3,
        fullName: 'Sarah Williams',
        employeeCode: employeeCode3,
        role: 'ROLE_EMPLOYEE',
        active: true,
        departmentId: dept4.id,
        jobId: job5.id
      },
      {
        username: 'mike.brown',
        password: employeePassword4,
        fullName: 'Mike Brown',
        employeeCode: employeeCode4,
        role: 'ROLE_EMPLOYEE',
        active: true,
        departmentId: dept5.id,
        jobId: job6.id
      },
      {
        username: 'david.wilson',
        password: employeePassword5,
        fullName: 'David Wilson',
        employeeCode: employeeCode5,
        role: 'ROLE_EMPLOYEE',
        active: true,
        departmentId: dept2.id,
        jobId: job7.id
      },
      {
        username: 'emma.davis',
        password: employeePassword6,
        fullName: 'Emma Davis',
        employeeCode: employeeCode6,
        role: 'ROLE_EMPLOYEE',
        active: true,
        departmentId: dept1.id,
        jobId: job8.id
      }
    ]).returning();

    console.log('✓ Users created with secure encrypted passwords');

    // Update jobs with userId to establish the relationship
    console.log('Linking jobs to users...');
    await db.update(jobs)
      .set({ userId: admin.id })
      .where(eq(jobs.id, job1.id));
    
    await db.update(jobs)
      .set({ userId: manager.id })
      .where(eq(jobs.id, job2.id));
    
    await db.update(jobs)
      .set({ userId: user1.id })
      .where(eq(jobs.id, job3.id));
    
    await db.update(jobs)
      .set({ userId: user2.id })
      .where(eq(jobs.id, job4.id));
    
    await db.update(jobs)
      .set({ userId: user3.id })
      .where(eq(jobs.id, job5.id));
    
    await db.update(jobs)
      .set({ userId: user4.id })
      .where(eq(jobs.id, job6.id));
    
    await db.update(jobs)
      .set({ userId: user5.id })
      .where(eq(jobs.id, job7.id));
    
    await db.update(jobs)
      .set({ userId: user6.id })
      .where(eq(jobs.id, job8.id));
    
    console.log('✓ Jobs linked to users');

    // Seed Personal Information
    console.log('Creating personal information...');
    await db.insert(personalInformation).values([
      {
        userId: admin.id,
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@company.com',
        address: '123 Main Street',
        city: 'Sulaymaniyah',
        country: 'Iraq',
        dateOfBirth: new Date('1985-05-15'),
        gender: 'Male',
        maritalStatus: 'Single'
      },
      {
        userId: manager.id,
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike.johnson@company.com',
        address: '321 Manager Boulevard',
        city: 'Erbil',
        country: 'Iraq',
        dateOfBirth: new Date('1982-11-08'),
        gender: 'Male',
        maritalStatus: 'Married'
      },
      {
        userId: user1.id,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        address: '456 Oak Avenue',
        city: 'Duhok',
        country: 'Iraq',
        dateOfBirth: new Date('1990-08-20'),
        gender: 'Male',
        maritalStatus: 'Married'
      },
      {
        userId: user2.id,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@company.com',
        address: '789 Pine Road',
        city: 'Sulaymaniyah',
        country: 'Iraq',
        dateOfBirth: new Date('1992-03-10'),
        gender: 'Female',
        maritalStatus: 'Single'
      },
      {
        userId: user3.id,
        firstName: 'Sarah',
        lastName: 'Williams',
        email: 'sarah.williams@company.com',
        address: '555 Maple Street',
        city: 'Erbil',
        country: 'Iraq',
        dateOfBirth: new Date('1988-06-25'),
        gender: 'Female',
        maritalStatus: 'Married'
      },
      {
        userId: user4.id,
        firstName: 'Mike',
        lastName: 'Brown',
        email: 'mike.brown@company.com',
        address: '777 Cedar Lane',
        city: 'Kirkuk',
        country: 'Iraq',
        dateOfBirth: new Date('1991-12-30'),
        gender: 'Male',
        maritalStatus: 'Single'
      },
      {
        userId: user5.id,
        firstName: 'David',
        lastName: 'Wilson',
        email: 'david.wilson@company.com',
        address: '999 Birch Avenue',
        city: 'Halabja',
        country: 'Iraq',
        dateOfBirth: new Date('1987-04-18'),
        gender: 'Male',
        maritalStatus: 'Married'
      },
      {
        userId: user6.id,
        firstName: 'Emma',
        lastName: 'Davis',
        email: 'emma.davis@company.com',
        address: '222 Elm Street',
        city: 'Sulaymaniyah',
        country: 'Iraq',
        dateOfBirth: new Date('1993-09-05'),
        gender: 'Female',
        maritalStatus: 'Single'
      }
    ]);

    console.log('✓ Personal information created');

    // Seed Department Announcements with Recipients
    console.log('Creating department announcements...');
    const [announcement1, announcement2, announcement3] = await db.insert(departmentAnnouncements).values([
      {
        title: 'Engineering Team Meeting',
        description: 'Monthly engineering team meeting to discuss project updates and technical roadmap',
        date: new Date('2024-11-01'),
        departmentId: dept2.id,
        isActive: true
      },
      {
        title: 'Company-wide Year-end Review',
        description: 'Annual performance review session for all employees',
        date: new Date('2024-12-15'),
        departmentId: null, // Company-wide announcement
        isActive: true
      },
      {
        title: 'Welcome to the Team!',
        description: 'Welcome message for all new employees joining our Engineering department',
        date: new Date('2024-10-20'),
        departmentId: dept2.id,
        isActive: true
      }
    ]).returning();

    console.log('✓ Department announcements created');

    // Create Announcement Recipients
    console.log('Creating announcement recipients...');
    await db.insert(announcementRecipients).values([
      // Engineering Team Meeting - targeted to engineering employees
      {
        announcementId: announcement1.id,
        userId: user1.id, // John Doe (Engineering Employee)
        isRead: false
      },
      {
        announcementId: announcement1.id,
        userId: manager.id, // Manager (Engineering Manager)
        isRead: false
      },
      
      // Company-wide Year-end Review - targeted to all employees
      {
        announcementId: announcement2.id,
        userId: admin.id,
        isRead: false
      },
      {
        announcementId: announcement2.id,
        userId: manager.id,
        isRead: false
      },
      {
        announcementId: announcement2.id,
        userId: user1.id,
        isRead: false
      },
      {
        announcementId: announcement2.id,
        userId: user2.id, // Jane Smith (Finance Employee)
        isRead: false
      },
      
      // Welcome message - targeted to specific engineering employee
      {
        announcementId: announcement3.id,
        userId: user1.id, // John Doe
        isRead: false
      }
    ]);

    console.log('✓ Announcement recipients created');

    // Seed Expenses
    console.log('Creating expenses...');
    await db.insert(expenses).values([
      {
        userId: user1.id,
        amount: 150,
        reason: 'Office supplies',
        status: 'approved',
        date: new Date('2024-10-15')
      },
      {
        userId: user2.id,
        amount: 300,
        reason: 'Business travel',
        status: 'pending',
        date: new Date('2024-10-18')
      },
      {
        userId: user3.id,
        amount: 200,
        reason: 'Marketing materials',
        status: 'approved',
        date: new Date('2024-10-20')
      },
      {
        userId: user4.id,
        amount: 500,
        reason: 'Client meeting expenses',
        status: 'pending',
        date: new Date('2024-10-22')
      },
      {
        userId: user5.id,
        amount: 180,
        reason: 'Software licenses',
        status: 'approved',
        date: new Date('2024-10-25')
      }
    ]);

    console.log('✓ Expenses created');

    // Seed Payments
    console.log('Creating payments...');
    await db.insert(payments).values([
      {
        userId: manager.id,
        amount: 65000,
        type: 'salary',
        date: new Date('2024-10-01'),
        description: 'October 2024 salary'
      },
      {
        userId: user1.id,
        amount: 55000,
        type: 'salary',
        date: new Date('2024-10-01'),
        description: 'October 2024 salary'
      },
      {
        userId: user2.id,
        amount: 40000,
        type: 'salary',
        date: new Date('2024-10-01'),
        description: 'October 2024 salary'
      },
      {
        userId: user3.id,
        amount: 50000,
        type: 'salary',
        date: new Date('2024-10-01'),
        description: 'October 2024 salary'
      },
      {
        userId: user4.id,
        amount: 35000,
        type: 'salary',
        date: new Date('2024-10-01'),
        description: 'October 2024 salary'
      },
      {
        userId: user5.id,
        amount: 70000,
        type: 'salary',
        date: new Date('2024-10-01'),
        description: 'October 2024 salary'
      },
      {
        userId: user6.id,
        amount: 38000,
        type: 'salary',
        date: new Date('2024-10-01'),
        description: 'October 2024 salary'
      }
    ]);

    console.log('✓ Payments created');

    // Seed Days Holiday
    console.log('Creating holiday requests...');
    await db.insert(daysHoliday).values([
      {
        userId: user1.id,
        startDate: new Date('2024-12-20'),
        endDate: new Date('2024-12-31'),
        reason: 'Christmas vacation',
        status: 'approved'
      },
      {
        userId: user2.id,
        startDate: new Date('2024-11-15'),
        endDate: new Date('2024-11-17'),
        reason: 'Personal leave',
        status: 'pending'
      }
    ]);

    console.log('✓ Holiday requests created');

    // Seed Days Working
    console.log('Creating working days records...');
    await db.insert(daysWorking).values([
      {
        userId: user1.id,
        date: new Date('2024-10-17'),
        hoursWorked: 8,
        description: 'Regular workday'
      },
      {
        userId: user2.id,
        date: new Date('2024-10-17'),
        hoursWorked: 9,
        description: 'Overtime for project deadline'
      }
    ]);

    console.log('✓ Working days records created');

    // Seed Personal Events
    console.log('Creating personal events...');
    await db.insert(personalEvents).values([
      {
        userId: user1.id,
        title: 'Birthday',
        description: 'Employee birthday celebration',
        date: new Date('2024-08-20')
      },
      {
        userId: user2.id,
        title: 'Work Anniversary',
        description: '1 year with the company',
        date: new Date('2025-03-10')
      }
    ]);

    console.log('✓ Personal events created');

    // Seed Messages
    console.log('Creating messages...');
    await db.insert(messages).values([
      {
        fromUserId: admin.id,
        toUserId: user1.id,
        message: 'Welcome to the team!',
        read: true
      },
      {
        fromUserId: user1.id,
        toUserId: user2.id,
        message: 'Can we schedule a meeting for the new project?',
        read: false
      }
    ]);

    console.log('✓ Messages created');

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- 5 Departments');
    console.log('- 8 Jobs');
    console.log('- 8 Users (admin, manager, and 6 employees)');
    console.log('- Personal & Financial Information');
    console.log('- Sample announcements, expenses, payments, holidays, etc.');
    console.log('\n🔑 Login credentials (SECURE PASSWORDS):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Username: admin           | Password: Admin@2024!Secure      (Admin Role)');
    console.log('Username: manager         | Password: Manager@2024!Strong    (Manager Role)');
    console.log('Username: john.doe        | Password: Employee@2024!John     (Employee)');
    console.log('Username: jane.smith      | Password: Employee@2024!Jane     (Employee)');
    console.log('Username: sarah.williams  | Password: Employee@2024!Sarah    (Employee)');
    console.log('Username: mike.brown      | Password: Employee@2024!Mike     (Employee)');
    console.log('Username: david.wilson    | Password: Employee@2024!David    (Employee)');
    console.log('Username: emma.davis      | Password: Employee@2024!Emma     (Employee)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ All passwords meet security requirements:');
    console.log('   ✓ Minimum 8 characters');
    console.log('   ✓ Contains uppercase letters');
    console.log('   ✓ Contains lowercase letters');
    console.log('   ✓ Contains numbers');
    console.log('   ✓ Contains special characters');
    console.log('   ✓ Encrypted with bcrypt (10 rounds)');
    console.log('\n⚠️  IMPORTANT: Change these passwords after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
