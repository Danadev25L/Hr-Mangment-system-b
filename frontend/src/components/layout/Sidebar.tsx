'use client'

import React, { memo } from 'react'
import { Layout } from 'antd'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { AvatarWithInitials } from '@/components/ui/AvatarWithInitials'
import { SidebarMenu } from './SidebarMenu'
import sidebarLogo from '@/public/3077977b-aff9-48f0-9592-9c087ded197d.png'

const { Sider } = Layout

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  user: any
  roleColors: any
  currentMenuItems: any[]
  selectedKeys: string[]
  openSubmenuKeys: string[]
  setOpenSubmenuKeys: (keys: string[]) => void
  pathname: string
  locale: string
}

export const Sidebar = memo<SidebarProps>(({
  collapsed,
  setCollapsed,
  user,
  roleColors,
  currentMenuItems,
  selectedKeys,
  openSubmenuKeys,
  setOpenSubmenuKeys,
  pathname,
  locale
}) => {
  const sidebarContent = (
    <div 
      className="h-full flex flex-col"
      style={{
        background: roleColors.gradient,
        color: 'white'
      }}
    >
      {/* Logo & Branding Section */}
      <div className={cn(
        "border-b border-white/10",
        collapsed ? "py-5 px-2" : "py-6 px-4"
      )}>
        {!collapsed ? (
          <div className="flex items-center justify-center">
            <Image 
              src={sidebarLogo}
              alt="HR Management System" 
              width={140}
              height={50}
              className="h-12 w-auto object-contain"
              priority
            />
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <Image 
              src={sidebarLogo}
              alt="HR" 
              width={45}
              height={45}
              className="h-10 w-auto object-contain"
              priority
            />
          </div>
        )}
      </div>

      {/* User Profile Section */}
      <div className={cn(
        "border-b border-white/10",
        collapsed ? "py-4 px-2" : "py-5 px-4"
      )}>
        <div className={cn(
          "flex items-center",
          collapsed ? "justify-center" : "px-2"
        )}>
          <div className="flex-shrink-0 ring-2 ring-white/30 rounded-full">
            <AvatarWithInitials 
              name={user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
              size={collapsed ? 'sm' : 'md'}
              variant="gradient"
            />
          </div>
          {!collapsed && (
            <div className="ml-3 rtl:ml-0 rtl:mr-3 flex-1 min-w-0">
              <p className="text-sm font-semibold !text-white truncate">
                {user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Menu Section */}
      <SidebarMenu
        collapsed={collapsed}
        currentMenuItems={currentMenuItems}
        selectedKeys={selectedKeys}
        openSubmenuKeys={openSubmenuKeys}
        setOpenSubmenuKeys={setOpenSubmenuKeys}
        pathname={pathname}
        locale={locale}
      />

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-white/10 py-4 px-6">
          <p className="text-xs text-white/60 text-center">
            © 2024 HRS System
          </p>
        </div>
      )}
    </div>
  )

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
      className="hidden md:block border-r border-gray-200 dark:border-gray-800 shadow-lg"
      width={260}
      collapsedWidth={80}
    >
      {sidebarContent}
    </Sider>
  )
})

Sidebar.displayName = 'Sidebar'
