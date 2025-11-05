'use client'

import React, { memo } from 'react'
import { Layout, Avatar, Dropdown, Button } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { ThemeToggle } from '@/components/ThemeToggle'
import LocaleSwitcher from '@/components/LocaleSwitcher'
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'

const { Header } = Layout

interface DashboardHeaderProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  user: any
  locale: string
  validRoleKey: string
  userMenuItems: any[]
}

export const DashboardHeader = memo<DashboardHeaderProps>(({
  collapsed,
  setCollapsed,
  user,
  locale,
  validRoleKey,
  userMenuItems
}) => {
  const t = useTranslations()

  return (
    <Header 
      className="sticky top-0 z-10 px-4 md:px-6 flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-16 shadow-sm"
    >
      <div className="flex items-center space-x-3 rtl:space-x-reverse">
        {/* Enhanced Collapse button */}
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed)}
          className="!text-gray-600 dark:!text-gray-400 hover:!text-gray-900 dark:hover:!text-white hover:!bg-gray-100 dark:hover:!bg-gray-800 !rounded-lg !w-10 !h-10 flex items-center justify-center transition-all"
          size="large"
        />
        <div className="hidden sm:flex items-center space-x-2 rtl:space-x-reverse">
          <h1 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
            {t('common.appName')}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3 rtl:space-x-reverse">
        {/* Enhanced Notification Dropdown */}
        <NotificationDropdown locale={locale} role={validRoleKey as 'admin' | 'manager' | 'employee'} />

        {/* Enhanced Locale Switcher */}
        <LocaleSwitcher />

        {/* Enhanced Theme Toggle */}
        <ThemeToggle />

        {/* Enhanced User Dropdown */}
        <Dropdown
          menu={{ 
            items: userMenuItems as any,
          }}
          placement="bottomRight"
          trigger={['click']}
        >
          <button className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md group">
            <Avatar
              src={user?.avatar}
              icon={<UserOutlined />}
              size={38}
              className="!bg-gradient-to-br !from-blue-500 !to-indigo-600 !text-white ring-2 ring-white dark:ring-gray-700 shadow-md group-hover:scale-105 transition-transform"
            />
            <div className="hidden lg:block text-left rtl:text-right">
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 capitalize leading-tight font-medium">
                {validRoleKey === 'admin' ? t('common.adminPortal') : validRoleKey === 'manager' ? t('common.managerPortal') : t('common.employeePortal')}
              </p>
            </div>
            <svg className="hidden lg:block w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </Dropdown>
      </div>
    </Header>
  )
})

DashboardHeader.displayName = 'DashboardHeader'
