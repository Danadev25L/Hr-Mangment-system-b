import {
  DashboardOutlined,
  TeamOutlined,
  FileTextOutlined,
  DollarOutlined,
  CalendarOutlined,
  NotificationOutlined,
  BarChartOutlined,
  HomeOutlined,
  BankOutlined,
  IdcardOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  SendOutlined,
  HistoryOutlined,
  PayCircleOutlined,
  ThunderboltOutlined,
  AuditOutlined,
  UserSwitchOutlined,
  ShopOutlined,
  PlusOutlined,
  FileSearchOutlined,
  UserOutlined,
  BellOutlined,
} from '@ant-design/icons'
import { createLocalizedPath } from '@/lib/localized-routes'

export const getMenuItems = (locale: string, t: any) => ({
  admin: [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: t('common.dashboard'),
      href: createLocalizedPath(locale, '/admin/dashboard'),
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('navigation.myProfile'),
      href: createLocalizedPath(locale, '/admin/profile'),
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: t('notifications.title'),
      href: createLocalizedPath(locale, '/admin/notifications'),
    },
    {
      key: 'employees',
      icon: <TeamOutlined />,
      label: t('navigation.employeeManagement'),
      children: [
        {
          key: 'employees-list',
          icon: <TeamOutlined />,
          label: t('navigation.allEmployees'),
          href: createLocalizedPath(locale, '/admin/employees'),
        },
        {
          key: 'employees-add',
          icon: <UserOutlined />,
          label: t('navigation.addEmployee'),
          href: createLocalizedPath(locale, '/admin/employees/add'),
        },
      ],
    },
    {
      key: 'expenses',
      icon: <DollarOutlined />,
      label: t('navigation.expenseManagement'),
      children: [
        {
          key: 'expenses-list',
          icon: <FileTextOutlined />,
          label: t('navigation.allExpenses'),
          href: createLocalizedPath(locale, '/admin/expenses'),
        },
        {
          key: 'expenses-add',
          icon: <DollarOutlined />,
          label: t('navigation.addExpense'),
          href: createLocalizedPath(locale, '/admin/expenses/add'),
        },
      ],
    },
    {
      key: 'applications',
      icon: <FileTextOutlined />,
      label: t('navigation.applicationManagement'),
      children: [
        {
          key: 'applications-list',
          icon: <FileTextOutlined />,
          label: t('navigation.allApplications'),
          href: createLocalizedPath(locale, '/admin/applications'),
        },
        {
          key: 'applications-add',
          icon: <PlusOutlined />,
          label: t('navigation.addApplication'),
          href: createLocalizedPath(locale, '/admin/applications/add'),
        },
      ],
    },
    {
      key: 'announcements',
      icon: <NotificationOutlined />,
      label: t('navigation.announcements'),
      children: [
        {
          key: 'announcements-list',
          icon: <NotificationOutlined />,
          label: t('navigation.allAnnouncements'),
          href: createLocalizedPath(locale, '/admin/announcements'),
        },
        {
          key: 'announcements-add',
          icon: <PlusOutlined />,
          label: t('navigation.createAnnouncement'),
          href: createLocalizedPath(locale, '/admin/announcements/add'),
        },
      ],
    },
    {
      key: 'attendance',
      icon: <ClockCircleOutlined />,
      label: t('navigation.attendanceManagement'),
      href: createLocalizedPath(locale, '/admin/attendance'),
    },
    {
      key: 'salary',
      icon: <PayCircleOutlined />,
      label: t('navigation.salaryManagement'),
      children: [
        {
          key: 'salary-list',
          icon: <PayCircleOutlined />,
          label: t('navigation.salaryList'),
          href: createLocalizedPath(locale, '/admin/salary'),
        },
        {
          key: 'salary-adjustments',
          icon: <ThunderboltOutlined />,
          label: t('navigation.salaryAdjustments'),
          href: createLocalizedPath(locale, '/admin/salary/adjustments'),
        },
      ],
    },
    {
      key: 'departments',
      icon: <BankOutlined />,
      label: t('navigation.departments'),
      href: createLocalizedPath(locale, '/admin/departments'),
    },
    {
      key: 'holidays',
      icon: <CalendarOutlined />,
      label: t('navigation.holidayManagement'),
      children: [
        {
          key: 'holidays-list',
          icon: <CalendarOutlined />,
          label: t('navigation.allHolidays'),
          href: createLocalizedPath(locale, '/admin/holidays'),
        },
        {
          key: 'holidays-add',
          icon: <PlusOutlined />,
          label: t('navigation.addHoliday'),
          href: createLocalizedPath(locale, '/admin/holidays/add'),
        },
      ],
    },
  ],
  manager: [
    {
      key: 'dashboard',
      icon: <HomeOutlined />,
      label: t('common.dashboard'),
      href: createLocalizedPath(locale, '/manager/dashboard'),
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('navigation.myProfile'),
      href: createLocalizedPath(locale, '/manager/profile'),
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: t('notifications.title'),
      href: createLocalizedPath(locale, '/manager/notifications'),
    },
    {
      key: 'employees',
      icon: <TeamOutlined />,
      label: t('navigation.myTeam'),
      children: [
        {
          key: 'employees-list',
          icon: <TeamOutlined />,
          label: t('navigation.allEmployees'),
          href: createLocalizedPath(locale, '/manager/employees'),
        },
        {
          key: 'employees-add',
          icon: <UserOutlined />,
          label: t('navigation.addEmployee'),
          href: createLocalizedPath(locale, '/manager/employees/add'),
        },
      ],
    },
    {
      key: 'applications',
      icon: <FileTextOutlined />,
      label: t('navigation.applications'),
      href: createLocalizedPath(locale, '/manager/applications'),
    },
    {
      key: 'expenses',
      icon: <DollarOutlined />,
      label: t('navigation.expenseManagement'),
      children: [
        {
          key: 'expenses-list',
          icon: <FileTextOutlined />,
          label: t('navigation.allExpenses'),
          href: createLocalizedPath(locale, '/manager/expenses'),
        },
        {
          key: 'expenses-add',
          icon: <DollarOutlined />,
          label: t('navigation.addExpense'),
          href: createLocalizedPath(locale, '/manager/expenses/add'),
        },
      ],
    },
    {
      key: 'announcements',
      icon: <NotificationOutlined />,
      label: t('navigation.announcements'),
      children: [
        {
          key: 'announcements-list',
          icon: <NotificationOutlined />,
          label: t('navigation.allAnnouncements'),
          href: createLocalizedPath(locale, '/manager/announcements'),
        },
        {
          key: 'announcements-add',
          icon: <SendOutlined />,
          label: t('navigation.createAnnouncement'),
          href: createLocalizedPath(locale, '/manager/announcements/add'),
        },
      ],
    },
    {
      key: 'attendance',
      icon: <ClockCircleOutlined />,
      label: t('navigation.attendance'),
      href: createLocalizedPath(locale, '/manager/attendance'),
    },
    {
      key: 'salary',
      icon: <PayCircleOutlined />,
      label: t('navigation.salary'),
      href: createLocalizedPath(locale, '/manager/salary'),
    },
    {
      key: 'holidays',
      icon: <CalendarOutlined />,
      label: t('navigation.holidays'),
      href: createLocalizedPath(locale, '/manager/holidays'),
    },
  ],
  employee: [
    {
      key: 'dashboard',
      icon: <HomeOutlined />,
      label: t('common.dashboard'),
      href: createLocalizedPath(locale, '/employee/dashboard'),
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('navigation.myProfile'),
      href: createLocalizedPath(locale, '/employee/profile'),
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: t('notifications.title'),
      href: createLocalizedPath(locale, '/employee/notifications'),
    },
    {
      key: 'applications',
      icon: <FileTextOutlined />,
      label: t('navigation.myApplications'),
      children: [
        {
          key: 'applications-list',
          icon: <FileTextOutlined />,
          label: t('navigation.viewApplications'),
          href: createLocalizedPath(locale, '/employee/applications'),
        },
        {
          key: 'applications-add',
          icon: <SendOutlined />,
          label: t('navigation.submitApplication'),
          href: createLocalizedPath(locale, '/employee/applications/add'),
        },
      ],
    },
    {
      key: 'announcements',
      icon: <NotificationOutlined />,
      label: t('navigation.announcements'),
      href: createLocalizedPath(locale, '/employee/announcements'),
    },
    {
      key: 'attendance',
      icon: <ClockCircleOutlined />,
      label: t('navigation.myAttendance'),
      href: createLocalizedPath(locale, '/employee/attendance'),
    },
    {
      key: 'holidays',
      icon: <CalendarOutlined />,
      label: t('navigation.holidays'),
      href: createLocalizedPath(locale, '/employee/holidays'),
    },
  ],
})

export const roleColors = {
  admin: {
    primary: '#3B82F6',
    light: '#EFF6FF',
    medium: '#DBEAFE',
    dark: '#1E40AF',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
    hover: '#2563EB',
    shadow: 'rgba(59, 130, 246, 0.2)',
  },
  manager: {
    primary: '#10B981',
    light: '#ECFDF5',
    medium: '#D1FAE5',
    dark: '#065F46',
    gradient: 'linear-gradient(135deg, #10B981 0%, #065F46 100%)',
    hover: '#059669',
    shadow: 'rgba(16, 185, 129, 0.2)',
  },
  employee: {
    primary: '#EF4444',
    light: '#FEF2F2',
    medium: '#FEE2E2',
    dark: '#991B1B',
    gradient: 'linear-gradient(135deg, #EF4444 0%, #991B1B 100%)',
    hover: '#DC2626',
    shadow: 'rgba(239, 68, 68, 0.2)',
  }
}
