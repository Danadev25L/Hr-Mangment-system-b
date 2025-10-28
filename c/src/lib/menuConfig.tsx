import { MenuItem, UserRole } from '@/src/types';

import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  BellOutlined,
  DollarOutlined,
  CalendarOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';

// Menu configuration for each role based on backend routes
export const getMenuItems = (role: UserRole): MenuItem[] => {
  switch (role) {
    case 'ROLE_ADMIN':
    case 'admin':
      return [
        {
          key: 'dashboard',
          label: 'Admin Dashboard',
          icon: <DashboardOutlined />,
          path: '/admin',
        },
        {
          key: 'users',
          label: 'Employee Management',
          icon: <UserOutlined />,
          path: '/admin/users',
          children: [
            {
              key: 'users-add',
              label: 'Add Employee',
              path: '/admin/users/add',
            },
            {
              key: 'users-list',
              label: 'Employee List',
              path: '/admin/users',
            },
          ],
        },
        {
          key: 'departments',
          label: 'Departments',
          icon: <AppstoreOutlined />,
          path: '/admin/departments',
        },
        {
          key: 'expenses',
          label: 'Expenses',
          icon: <DollarOutlined />,
          path: '/admin/expenses/track',
          children: [
            {
              key: 'expenses-track',
              label: 'Expense Tracking',
              path: '/admin/expenses/track',
            },
            {
              key: 'expenses-create',
              label: 'Create Expense',
              path: '/admin/expenses/create',
            },
          ],
        },
        {
          key: 'announcements',
          label: 'Announcements',
          icon: <BellOutlined />,
          path: '/admin/announcements',
        },
        {
          key: 'payroll',
          label: 'Payroll & Payments',
          icon: <DollarOutlined />,
          path: '/admin/payroll',
        },
        {
          key: 'applications',
          label: 'Applications',
          icon: <FileTextOutlined />,
          path: '/admin/applications',
          children: [
            {
              key: 'applications-send',
              label: 'Application Sending',
              path: '/admin/applications/send',
            },
            {
              key: 'applications-track',
              label: 'Application Tracking',
              path: '/admin/applications',
            },
          ],
        },
      ];

    case 'ROLE_MANAGER':
    case 'manager':
      return [
        {
          key: 'dashboard',
          label: 'Manager Dashboard',
          icon: <DashboardOutlined />,
          path: '/manager',
        },
        {
          key: 'employees',
          label: 'Employee Management',
          icon: <TeamOutlined />,
          path: '/manager/employees',
          children: [
            {
              key: 'employees-add',
              label: 'Add Employee',
              path: '/manager/employees/add',
            },
            {
              key: 'employees-list',
              label: 'Employee List',
              path: '/manager/employees',
            },
          ],
        },
        {
          key: 'announcements',
          label: 'Announcements',
          icon: <BellOutlined />,
          path: '/manager/announcements',
        },
        {
          key: 'applications',
          label: 'Applications',
          icon: <FileTextOutlined />,
          path: '/manager/applications',
          children: [
            {
              key: 'applications-send',
              label: 'Application Sending',
              path: '/manager/applications/send',
            },
            {
              key: 'applications-track',
              label: 'Application Tracking',
              path: '/manager/applications',
            },
          ],
        },
        {
          key: 'jobs',
          label: 'Job Management',
          icon: <AppstoreOutlined />,
          path: '/manager/jobs',
          children: [
            {
              key: 'jobs-new',
              label: 'New Job Application',
              path: '/manager/jobs/new',
            },
            {
              key: 'jobs-list',
              label: 'Job List',
              path: '/manager/jobs',
            },
          ],
        },
        {
          key: 'expenses',
          label: 'Expenses',
          icon: <DollarOutlined />,
          path: '/manager/expenses',
          children: [
            {
              key: 'expenses-track',
              label: 'My Expenses',
              path: '/manager/expenses',
            },
            {
              key: 'expenses-create',
              label: 'Create Expense',
              path: '/manager/expenses/create',
            },
          ],
        },
      ];

    case 'ROLE_EMPLOYEE':
    case 'employee':
      return [
        {
          key: 'dashboard',
          label: 'My Dashboard',
          icon: <DashboardOutlined />,
          path: '/employee',
        },
        {
          key: 'profile',
          label: 'My Profile',
          icon: <UserOutlined />,
          path: '/employee/profile',
        },
        {
          key: 'applications',
          label: 'Applications',
          icon: <FileTextOutlined />,
          path: '/employee/applications',
          children: [
            {
              key: 'applications-send',
              label: 'Application Sending',
              path: '/employee/applications/send',
            },
            {
              key: 'applications-track',
              label: 'Application Tracking',
              path: '/employee/applications',
            },
          ],
        },
        {
          key: 'salary-history',
          label: 'Salary History',
          icon: <DollarOutlined />,
          path: '/employee/salary-history',
        },
        {
          key: 'overtime',
          label: 'Overtime',
          icon: <CalendarOutlined />,
          path: '/employee/overtime',
        },
        {
          key: 'notifications',
          label: 'Notifications',
          icon: <BellOutlined />,
          path: '/employee/notifications',
        },
      ];

    default:
      return [];
  }
};
