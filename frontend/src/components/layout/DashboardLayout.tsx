'use client'

import React, { useState, ReactNode, useEffect, useMemo } from 'react'
import { Layout } from 'antd'
import {
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from 'next-intl'
import { createLocalizedPath, getCurrentLocale } from '@/lib/localized-routes'
import { Sidebar } from './Sidebar'
import { DashboardHeader } from './DashboardHeader'
import { getMenuItems, roleColors } from './menuConfig'

const { Content } = Layout

interface DashboardLayoutProps {
  children: ReactNode
  role: 'admin' | 'manager' | 'employee' | 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_EMPLOYEE'
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, role }) => {
  const [collapsed, setCollapsed] = useState(true)
  const [openSubmenuKeys, setOpenSubmenuKeys] = useState<string[]>([])
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations()

  // Get locale from pathname
  const locale = getCurrentLocale(pathname)

  // Convert role format to simpler version for menu lookup
  const roleKey = role.replace('ROLE_', '').toLowerCase()

  // Validate roleKey and provide fallback
  const validRoleKey = ['admin', 'manager', 'employee'].includes(roleKey) ? roleKey : 'admin'

  // Get current role colors
  const currentRoleColors = roleColors[validRoleKey as keyof typeof roleColors]

  // Get menu items for current role
  const allMenuItems = useMemo(() => getMenuItems(locale, t), [locale, t])
  const currentMenuItems = allMenuItems[validRoleKey as keyof typeof allMenuItems]

  // Auto-expand parent menu items when navigating to a child page
  useEffect(() => {
    const findParentKey = (items: any[]): string | null => {
      for (const item of items) {
        if (!item || !('key' in item)) continue
        
        if ('children' in item && item.children) {
          const hasMatchingChild = item.children.some(
            (child: any) => child && 'href' in child && child.href && pathname === child.href
          )
          if (hasMatchingChild) {
            return String(item.key)
          }
        }
      }
      return null
    }

    const parentKey = findParentKey(currentMenuItems)
    if (parentKey && !openSubmenuKeys.includes(parentKey)) {
      setOpenSubmenuKeys([parentKey])
    }
  }, [pathname, currentMenuItems, openSubmenuKeys])

  // Handle logout
  const handleLogout = async () => {
    await logout()
    router.push(createLocalizedPath(locale, '/login'))
  }

  // User dropdown menu items
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('common.profile'),
      onClick: () => router.push(createLocalizedPath(locale, `/${validRoleKey}/profile`)),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('common.settings'),
      onClick: () => router.push(createLocalizedPath(locale, `/${validRoleKey}/settings`)),
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
  const selectedKeys = useMemo(() => {
    const findMatchingKey = (items: any[]): string | null => {
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
  }, [pathname, currentMenuItems])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar Component */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        user={user}
        roleColors={currentRoleColors}
        currentMenuItems={currentMenuItems}
        selectedKeys={selectedKeys}
        openSubmenuKeys={openSubmenuKeys}
        setOpenSubmenuKeys={setOpenSubmenuKeys}
        pathname={pathname}
        locale={locale}
      />
      
      <Layout>
        {/* Header Component */}
        <DashboardHeader
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          user={user}
          locale={locale}
          validRoleKey={validRoleKey}
          userMenuItems={userMenuItems}
        />
        
        {/* Main Content */}
        <Content
          style={{
            margin: '16px',
            padding: 24,
            minHeight: 280,
            background: 'var(--bg-color)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
