'use client'

import React, { useState, ReactNode, useEffect } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button, Badge, Drawer } from 'antd'
import type { MenuProps } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
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
} from '@ant-design/icons'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ThemeToggle'

const { Header, Sider, Content } = Layout

interface DashboardLayoutProps {
  children: ReactNode
  role: 'admin' | 'manager' | 'employee' | 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_EMPLOYEE'
}

type MenuItem = Required<MenuProps>['items'][number]

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, role }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Convert role format to simpler version for menu lookup
  const roleKey = role.replace('ROLE_', '').toLowerCase()

  // Validate roleKey and provide fallback
  const validRoleKey = ['admin', 'manager', 'employee'].includes(roleKey) ? roleKey : 'admin'

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileDrawerOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const menuItems: Record<string, MenuItem[]> = {
    admin: [
      {
        key: 'dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
        href: '/admin/dashboard',
      },
      {
        key: 'employees',
        icon: <TeamOutlined />,
        label: 'Employee Management',
        children: [
          {
            key: 'employees-list',
            icon: <TeamOutlined />,
            label: 'All Employees',
            href: '/admin/employees',
          },
          {
            key: 'employees-add',
            icon: <UserOutlined />,
            label: 'Add Employee',
            href: '/admin/employees/add',
          },
        ],
      },
      {
        key: 'expenses',
        icon: <DollarOutlined />,
        label: 'Expense Management',
        children: [
          {
            key: 'expenses-list',
            icon: <FileTextOutlined />,
            label: 'All Expenses',
            href: '/admin/expenses',
          },
          {
            key: 'expenses-add',
            icon: <DollarOutlined />,
            label: 'Add Expense',
            href: '/admin/expenses/add',
          },
        ],
      },
      {
        key: 'applications',
        icon: <FileTextOutlined />,
        label: 'Application Management',
        children: [
          {
            key: 'applications-list',
            icon: <FileTextOutlined />,
            label: 'All Applications',
            href: '/admin/applications',
          },
          {
            key: 'applications-add',
            icon: <PlusOutlined />,
            label: 'Add Application',
            href: '/admin/applications/add',
          },
        ],
      },
      {
        key: 'announcements',
        icon: <NotificationOutlined />,
        label: 'Announcements',
        children: [
          {
            key: 'announcements-list',
            icon: <NotificationOutlined />,
            label: 'All Announcements',
            href: '/admin/announcements',
          },
          {
            key: 'announcements-add',
            icon: <PlusOutlined />,
            label: 'Create Announcement',
            href: '/admin/announcements/add',
          },
        ],
      },
      {
        key: 'holidays',
        icon: <CalendarOutlined />,
        label: 'Holidays',
        children: [
          {
            key: 'holidays-list',
            icon: <CalendarOutlined />,
            label: 'All Holidays',
            href: '/admin/holidays',
          },
          {
            key: 'holidays-add',
            icon: <PlusOutlined />,
            label: 'Add Holiday',
            href: '/admin/holidays/add',
          },
        ],
      },
      {
        key: 'departments',
        icon: <BankOutlined />,
        label: 'Departments',
        href: '/admin/departments',
      },
      {
        key: 'attendance',
        icon: <ClockCircleOutlined />,
        label: 'Attendance',
        children: [
          {
            key: 'attendance-records',
            icon: <ClockCircleOutlined />,
            label: 'All Records',
            href: '/admin/attendance',
          },
          {
            key: 'attendance-corrections',
            icon: <FileSearchOutlined />,
            label: 'Corrections',
            href: '/admin/attendance/corrections',
          },
        ],
      },
    ],
    manager: [
      {
        key: 'dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
        href: '/manager/dashboard',
      },
      {
        key: 'team-management',
        icon: <TeamOutlined />,
        label: 'Team Management',
        children: [
          {
            key: 'team-all',
            icon: <TeamOutlined />,
            label: 'All Employees',
            href: '/manager/employees',
          },
          {
            key: 'team-add',
            icon: <UserOutlined />,
            label: 'Add Employee',
            href: '/manager/employees/add',
          },
        ],
      },
      {
        key: 'expenses',
        icon: <DollarOutlined />,
        label: 'Expense Management',
        children: [
          {
            key: 'expenses-list',
            icon: <FileTextOutlined />,
            label: 'All Expenses',
            href: '/manager/expenses',
          },
          {
            key: 'expenses-add',
            icon: <DollarOutlined />,
            label: 'Add Expense',
            href: '/manager/expenses/add',
          },
        ],
      },
      {
        key: 'applications',
        icon: <FileTextOutlined />,
        label: 'Application Management',
        children: [
          {
            key: 'applications-list',
            icon: <FileTextOutlined />,
            label: 'All Applications',
            href: '/manager/applications',
          },
          {
            key: 'applications-add',
            icon: <PlusOutlined />,
            label: 'Add Application',
            href: '/manager/applications/add',
          },
        ],
      },
      {
        key: 'announcements',
        icon: <NotificationOutlined />,
        label: 'Announcements',
        children: [
          {
            key: 'announcements-list',
            icon: <NotificationOutlined />,
            label: 'Department Announcements',
            href: '/manager/announcements',
          },
          {
            key: 'announcements-add',
            icon: <PlusOutlined />,
            label: 'Create Announcement',
            href: '/manager/announcements/add',
          },
        ],
      },
      {
        key: 'holidays',
        icon: <CalendarOutlined />,
        label: 'Company Holidays',
        href: '/manager/holidays',
      },
      {
        key: 'team-overview',
        icon: <BarChartOutlined />,
        label: 'Team Overview',
        href: '/manager/team',
      },
      {
        key: 'attendance',
        icon: <ClockCircleOutlined />,
        label: 'Team Attendance',
        children: [
          {
            key: 'attendance-team',
            icon: <TeamOutlined />,
            label: 'Team Status',
            href: '/manager/attendance',
          },
          {
            key: 'attendance-corrections',
            icon: <FileSearchOutlined />,
            label: 'Pending Corrections',
            href: '/manager/attendance/corrections',
          },
        ],
      },
    ],
    employee: [
      {
        key: 'dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
        href: '/employee/dashboard',
      },
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'My Profile',
        href: '/employee/profile',
      },
      {
        key: 'announcements',
        icon: <NotificationOutlined />,
        label: 'Announcements',
        href: '/employee/announcements',
      },
      {
        key: 'holidays',
        icon: <CalendarOutlined />,
        label: 'Company Holidays',
        href: '/employee/holidays',
      },
      {
        key: 'attendance',
        icon: <ClockCircleOutlined />,
        label: 'My Attendance',
        children: [
          {
            key: 'attendance-records',
            icon: <ClockCircleOutlined />,
            label: 'Attendance Records',
            href: '/employee/attendance',
          },
          {
            key: 'attendance-corrections',
            icon: <FileSearchOutlined />,
            label: 'My Corrections',
            href: '/employee/attendance/corrections',
          },
        ],
      },
    ],
  }

  // Get menu items for current role
  const currentMenuItems = menuItems[validRoleKey]

  const handleMenuClick = ({ key }: { key: string }) => {
    const findMenuItem = (items: MenuItem[], key: string): MenuItem | null => {
      for (const item of items) {
        if ('key' in item && item.key === key) return item
        if ('children' in item && item.children) {
          const found = findMenuItem(item.children, key)
          if (found) return found
        }
      }
      return null
    }

    const menuItem = findMenuItem(currentMenuItems, key)
    if (menuItem && 'href' in menuItem && menuItem.href) {
      router.push(menuItem.href)
      setMobileDrawerOpen(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => router.push(`/${validRoleKey}/profile`),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => router.push(`/${validRoleKey}/settings`),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ]

  const selectedKeys = [pathname.split('/').pop() || 'dashboard']

  const sidebarContent = (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <UserOutlined className="text-primary-600" />
          </div>
          {!collapsed && (
            <div>
              <p className="font-semibold text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          items={currentMenuItems}
          onClick={handleMenuClick}
          className="border-none"
        />
      </div>

      {!collapsed && (
        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            © 2024 HRS System
          </p>
        </div>
      )}
    </div>
  )

  return (
    <Layout className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className={cn(
          'bg-white dark:bg-gray-800 shadow-lg hidden md:block border-r border-gray-200 dark:border-gray-700',
          collapsed ? 'w-20' : 'w-64'
        )}
        width={256}
        collapsedWidth={80}
      >
        {sidebarContent}
      </Sider>

      {/* Mobile Drawer */}
      <Drawer
        title="Menu"
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        className="md:hidden"
        styles={{
          body: { padding: 0 },
          header: { backgroundColor: 'inherit' }
        }}
      >
        {sidebarContent}
      </Drawer>

      <Layout>
        <Header className="bg-white dark:bg-gray-800 shadow-sm px-4 flex items-center justify-between sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="md:hidden"
            />
            <Button
              type="text"
              icon={<MenuUnfoldOutlined />}
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden"
            />
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200 capitalize">
              {validRoleKey} Dashboard
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <Badge count={5} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                className="flex items-center justify-center w-10 h-10"
                onClick={() => router.push(`/${validRoleKey}/notifications`)}
              />
            </Badge>

            <ThemeToggle />

            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors">
                <Avatar
                  src={user?.avatar}
                  icon={<UserOutlined />}
                  className="bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300"
                />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className="p-6 overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}