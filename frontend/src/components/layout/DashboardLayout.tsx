'use client'

import React, { useState, ReactNode, useEffect } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button, Badge, Drawer, Tooltip } from 'antd'
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
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ThemeToggle'
import LocaleSwitcher from '@/components/LocaleSwitcher'
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'
import { createLocalizedPath, getCurrentLocale } from '@/lib/localized-routes'

const { Header, Sider, Content } = Layout

interface DashboardLayoutProps {
  children: ReactNode
  role: 'admin' | 'manager' | 'employee' | 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_EMPLOYEE'
}

type MenuItem = Required<MenuProps>['items'][number]

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, role }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [openSubmenuKeys, setOpenSubmenuKeys] = useState<string[]>([])
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations()

  // Convert role format to simpler version for menu lookup
  const roleKey = role.replace('ROLE_', '').toLowerCase()

  // Validate roleKey and provide fallback
  const validRoleKey = ['admin', 'manager', 'employee'].includes(roleKey) ? roleKey : 'admin'

  // Define role-based color schemes with comprehensive theming
  const roleColors = {
    admin: {
      primary: '#3B82F6', // blue-600
      light: '#EFF6FF', // blue-50
      medium: '#DBEAFE', // blue-100
      dark: '#1E40AF', // blue-800
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
      hover: '#2563EB', // blue-700
      shadow: 'rgba(59, 130, 246, 0.2)',
    },
    manager: {
      primary: '#10B981', // green-600
      light: '#ECFDF5', // green-50
      medium: '#D1FAE5', // green-100
      dark: '#065F46', // green-800
      gradient: 'linear-gradient(135deg, #10B981 0%, #065F46 100%)',
      hover: '#059669', // green-700
      shadow: 'rgba(16, 185, 129, 0.2)',
    },
    employee: {
      primary: '#EF4444', // red-600
      light: '#FEF2F2', // red-50
      medium: '#FEE2E2', // red-100
      dark: '#991B1B', // red-800
      gradient: 'linear-gradient(135deg, #EF4444 0%, #991B1B 100%)',
      hover: '#DC2626', // red-700
      shadow: 'rgba(239, 68, 68, 0.2)',
    }
  }

  const currentRoleColors = roleColors[validRoleKey as keyof typeof roleColors]

  const locale = getCurrentLocale(pathname)

  const menuItems: Record<string, MenuItem[]> = {
    admin: [
      {
        key: 'dashboard',
        icon: <DashboardOutlined />,
        label: t('common.dashboard'),
        href: createLocalizedPath(locale, '/admin/dashboard'),
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
        key: 'holidays',
        icon: <CalendarOutlined />,
        label: t('navigation.holidays'),
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
      {
        key: 'salary',
        icon: <DollarOutlined />,
        label: t('navigation.salaryManagement'),
        children: [
          {
            key: 'salary-list',
            icon: <FileTextOutlined />,
            label: t('navigation.salaryList'),
            href: createLocalizedPath(locale, '/admin/salary'),
          },
          {
            key: 'salary-adjustments',
            icon: <PlusOutlined />,
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
        key: 'attendance',
        icon: <ClockCircleOutlined />,
        label: t('navigation.attendance'),
        children: [
          {
            key: 'attendance-records',
            icon: <ClockCircleOutlined />,
            label: t('navigation.allRecords'),
            href: createLocalizedPath(locale, '/admin/attendance'),
          },
          {
            key: 'attendance-corrections',
            icon: <FileSearchOutlined />,
            label: t('navigation.corrections'),
            href: createLocalizedPath(locale, '/admin/attendance/corrections'),
          },
        ],
      },
    ],
    manager: [
      {
        key: 'dashboard',
        icon: <DashboardOutlined />,
        label: t('common.dashboard'),
        href: createLocalizedPath(locale, '/manager/dashboard'),
      },
      {
        key: 'team-management',
        icon: <TeamOutlined />,
        label: t('navigation.teamManagement'),
        children: [
          {
            key: 'team-all',
            icon: <TeamOutlined />,
            label: t('navigation.allEmployees'),
            href: createLocalizedPath(locale, '/manager/employees'),
          },
          {
            key: 'team-add',
            icon: <UserOutlined />,
            label: t('navigation.addEmployee'),
            href: createLocalizedPath(locale, '/manager/employees/add'),
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
        key: 'applications',
        icon: <FileTextOutlined />,
        label: t('navigation.applicationManagement'),
        children: [
          {
            key: 'applications-list',
            icon: <FileTextOutlined />,
            label: t('navigation.allApplications'),
            href: createLocalizedPath(locale, '/manager/applications'),
          },
          {
            key: 'applications-add',
            icon: <PlusOutlined />,
            label: t('navigation.addApplication'),
            href: createLocalizedPath(locale, '/manager/applications/add'),
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
            label: t('navigation.departmentAnnouncements'),
            href: createLocalizedPath(locale, '/manager/announcements'),
          },
          {
            key: 'announcements-add',
            icon: <PlusOutlined />,
            label: t('navigation.createAnnouncement'),
            href: createLocalizedPath(locale, '/manager/announcements/add'),
          },
        ],
      },
      {
        key: 'holidays',
        icon: <CalendarOutlined />,
        label: t('navigation.companyHolidays'),
        href: createLocalizedPath(locale, '/manager/holidays'),
      },
      {
        key: 'team-overview',
        icon: <BarChartOutlined />,
        label: t('navigation.teamOverview'),
        href: createLocalizedPath(locale, '/manager/team'),
      },
      {
        key: 'attendance',
        icon: <ClockCircleOutlined />,
        label: t('navigation.teamAttendance'),
        children: [
          {
            key: 'attendance-team',
            icon: <TeamOutlined />,
            label: t('navigation.teamStatus'),
            href: createLocalizedPath(locale, '/manager/attendance'),
          },
          {
            key: 'attendance-corrections',
            icon: <FileSearchOutlined />,
            label: t('navigation.pendingCorrections'),
            href: createLocalizedPath(locale, '/manager/attendance/corrections'),
          },
        ],
      },
    ],
    employee: [
      {
        key: 'dashboard',
        icon: <DashboardOutlined />,
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
        key: 'announcements',
        icon: <NotificationOutlined />,
        label: t('navigation.announcements'),
        href: createLocalizedPath(locale, '/employee/announcements'),
      },
      {
        key: 'holidays',
        icon: <CalendarOutlined />,
        label: t('navigation.companyHolidays'),
        href: createLocalizedPath(locale, '/employee/holidays'),
      },
      {
        key: 'attendance',
        icon: <ClockCircleOutlined />,
        label: t('navigation.myAttendance'),
        children: [
          {
            key: 'attendance-records',
            icon: <ClockCircleOutlined />,
            label: t('navigation.attendanceRecords'),
            href: createLocalizedPath(locale, '/employee/attendance'),
          },
          {
            key: 'attendance-corrections',
            icon: <FileSearchOutlined />,
            label: t('navigation.myCorrections'),
            href: createLocalizedPath(locale, '/employee/attendance/corrections'),
          },
        ],
      },
    ],
  }

  // Get menu items for current role
  const currentMenuItems = menuItems[validRoleKey]

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileDrawerOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Initialize open submenus based on current path
  useEffect(() => {
    const findParentKey = (items: MenuItem[]): string | null => {
      for (const item of items) {
        if (!item || !('key' in item)) continue
        if ('children' in item && item.children) {
          const hasActiveChild = item.children.some((child: any) => 
            child && 'href' in child && pathname.includes(String(child.href))
          )
          if (hasActiveChild) return String(item.key)
        }
      }
      return null
    }

    const parentKey = findParentKey(currentMenuItems)
    if (parentKey && !openSubmenuKeys.includes(parentKey)) {
      setOpenSubmenuKeys([parentKey])
    }
  }, [pathname, currentMenuItems, openSubmenuKeys])

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
      label: t('common.profile'),
      onClick: () => router.push(`/${validRoleKey}/profile`),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('common.settings'),
      onClick: () => router.push(`/${validRoleKey}/settings`),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('common.logout'),
      onClick: handleLogout,
    },
  ]

  // Find selected menu key based on current pathname
  const getSelectedKeys = (): string[] => {
    const findMatchingKey = (items: MenuItem[]): string | null => {
      for (const item of items) {
        if (!item || !('key' in item)) continue
        
        // Check if this item has a direct href match
        if ('href' in item && item.href && pathname === item.href) {
          return String(item.key)
        }
        
        // Check children
        if ('children' in item && item.children) {
          for (const child of item.children) {
            if (child && 'href' in child && child.href && pathname === child.href) {
              return String(child.key)
            }
          }
        }
      }
      return null
    }
    
    const matchedKey = findMatchingKey(currentMenuItems)
    return matchedKey ? [matchedKey] : ['dashboard']
  }

  const selectedKeys = getSelectedKeys()

  const sidebarContent = (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Logo & Branding Section */}
      <div className={cn(
        "border-b border-gray-200 dark:border-gray-700",
        collapsed ? "py-5 px-4" : "py-6 px-6"
      )}>
        {!collapsed ? (
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded bg-gray-900 dark:bg-white flex items-center justify-center">
              <span className="text-white dark:text-gray-900 font-semibold text-base">HR</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">HRS System</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {validRoleKey} Portal
              </p>
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 rounded bg-gray-900 dark:bg-white flex items-center justify-center mx-auto">
            <span className="text-white dark:text-gray-900 font-semibold text-base">HR</span>
          </div>
        )}
      </div>

      {/* User Profile Section */}
      <div className={cn(
        "border-b border-gray-200 dark:border-gray-700",
        collapsed ? "py-4 px-4" : "py-5 px-6"
      )}>
        <div className="flex items-center">
          <div className={cn(
            "flex items-center justify-center rounded bg-gray-100 dark:bg-gray-800",
            collapsed ? "w-9 h-9" : "w-10 h-10"
          )}>
            <UserOutlined className="text-base text-gray-600 dark:text-gray-400" />
          </div>
          {!collapsed && (
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {validRoleKey}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Menu Section */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {currentMenuItems.map((item) => {
            if (!item || !('key' in item)) return null

            const itemKey = String(item.key)
            const isSelected = selectedKeys.includes(itemKey)
            const hasChildren = 'children' in item && item.children
            const isOpen = openSubmenuKeys.includes(itemKey)

            // Role-based colors
            const activeColorClass = validRoleKey === 'admin' 
              ? 'bg-blue-600 dark:bg-blue-600' 
              : validRoleKey === 'manager' 
              ? 'bg-green-600 dark:bg-green-600' 
              : 'bg-red-600 dark:bg-red-600'

            const hoverColorClass = validRoleKey === 'admin' 
              ? 'hover:bg-blue-50 dark:hover:bg-blue-950' 
              : validRoleKey === 'manager' 
              ? 'hover:bg-green-50 dark:hover:bg-green-950' 
              : 'hover:bg-red-50 dark:hover:bg-red-950'

            return (
              <div key={itemKey}>
                {collapsed ? (
                  <Tooltip
                    title={'label' in item ? String(item.label) : ''}
                    placement="right"
                    mouseEnterDelay={0.4}
                  >
                    <button
                      type="button"
                      onClick={() => handleMenuClick({ key: itemKey })}
                      className={cn(
                        "w-full flex items-center justify-center py-3 rounded transition-colors",
                        isSelected 
                          ? `${activeColorClass} text-white` 
                          : `text-gray-600 dark:text-gray-400 ${hoverColorClass}`
                      )}
                    >
                      <span className="text-base">
                        {'icon' in item ? item.icon : null}
                      </span>
                    </button>
                  </Tooltip>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (hasChildren) {
                          setOpenSubmenuKeys(prev => 
                            isOpen ? prev.filter(k => k !== itemKey) : [...prev, itemKey]
                          )
                        } else {
                          handleMenuClick({ key: itemKey })
                        }
                      }}
                      className={cn(
                        "w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                        isSelected
                          ? `${activeColorClass} text-white`
                          : `text-gray-700 dark:text-gray-300 ${hoverColorClass}`
                      )}
                    >
                      <span className={cn(
                        "mr-3 text-base",
                        isSelected ? "text-white" : "text-gray-500 dark:text-gray-400"
                      )}>
                        {'icon' in item ? item.icon : null}
                      </span>
                      <span className="flex-1 text-left">
                        {'label' in item ? item.label : ''}
                      </span>
                      {hasChildren && (
                        <svg
                          className={cn(
                            "w-3.5 h-3.5 transition-transform duration-200",
                            isOpen ? "rotate-90" : "rotate-0",
                            isSelected ? "text-white" : "text-gray-400 dark:text-gray-500"
                          )}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>

                    {/* Submenu */}
                    {hasChildren && isOpen && (
                      <div className="mt-1 ml-4 pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-1 py-1">
                        {item.children?.map((child) => {
                          if (!child || !('key' in child)) return null
                          const childKey = String(child.key)
                          const isChildSelected = selectedKeys.includes(childKey)

                          return (
                            <button
                              type="button"
                              key={childKey}
                              onClick={() => handleMenuClick({ key: childKey })}
                              className={cn(
                                "w-full flex items-center px-4 py-2.5 rounded-lg text-sm transition-colors",
                                isChildSelected
                                  ? `${activeColorClass} text-white font-medium`
                                  : `text-gray-600 dark:text-gray-400 ${hoverColorClass}`
                              )}
                            >
                              <span className={cn(
                                "mr-3 text-sm", 
                                isChildSelected ? "text-white" : "text-gray-400 dark:text-gray-500"
                              )}>
                                {'icon' in child ? child.icon : null}
                              </span>
                              <span className="flex-1 text-left">
                                {'label' in child ? child.label : ''}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-gray-200 dark:border-gray-700 py-3 px-6">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
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
        className="hidden md:block border-r border-gray-200 dark:border-gray-700"
        width={240}
        collapsedWidth={60}
        theme="light"
        style={{
          backgroundColor: 'transparent'
        }}
      >
        {sidebarContent}
      </Sider>

      {/* Mobile Drawer */}
      <Drawer
        title={t('common.menu')}
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        className="md:hidden"
        styles={{
          body: { padding: 0, backgroundColor: 'transparent' },
          header: { 
            backgroundColor: 'transparent',
            borderBottom: '1px solid',
            borderBottomColor: 'rgb(229, 231, 235)'
          }
        }}
        rootClassName="[&_.ant-drawer-header]:dark:border-gray-700 [&_.ant-drawer-content]:dark:bg-gray-900 [&_.ant-drawer-content]:bg-white"
      >
        {sidebarContent}
      </Drawer>

      <Layout className="bg-gray-50 dark:bg-gray-900">
        <Header 
          className="sticky top-0 z-10 px-6 flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 h-16"
        >
          <div className="flex items-center space-x-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex !text-gray-600 dark:!text-gray-400 hover:!text-gray-900 dark:hover:!text-white"
            />
            <Button
              type="text"
              icon={<MenuUnfoldOutlined />}
              onClick={() => setMobileDrawerOpen(true)}
              className="flex md:hidden !text-gray-600 dark:!text-gray-400 hover:!text-gray-900 dark:hover:!text-white"
            />
            <div className="flex items-center space-x-2.5">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('common.dashboard')}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Notification Dropdown */}
            <NotificationDropdown locale={locale} role={validRoleKey as 'admin' | 'manager' | 'employee'} />

            <LocaleSwitcher />

            <ThemeToggle />

            {/* User Dropdown */}
            <Dropdown
              menu={{ 
                items: userMenuItems as any,
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div className="flex items-center space-x-2.5 cursor-pointer px-2.5 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <Avatar
                  src={user?.avatar}
                  icon={<UserOutlined />}
                  size={32}
                  className="!bg-gray-200 dark:!bg-gray-700 !text-gray-600 dark:!text-gray-400"
                />
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {validRoleKey}
                  </p>
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
