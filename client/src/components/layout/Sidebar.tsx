'use client';

import { useAuthStore } from '@/src/store/useAuthStore';
import { getMenuItems } from '@/src/lib/menuConfig';

import React, { useMemo } from 'react';

import { Layout, Menu, Avatar, Badge } from 'antd';
import { 
  UserOutlined, 
  CrownOutlined, 
  TeamOutlined, 
  SettingOutlined,
  BellOutlined
} from '@ant-design/icons';

import { useRouter, usePathname } from 'next/navigation';

import type { MenuProps } from 'antd';

const { Sider } = Layout;

interface SidebarProps {
  collapsed?: boolean;
}

const SidebarComponent: React.FC<SidebarProps> = ({ collapsed = false }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();

  // Get menu items based on user role - optimized to prevent unnecessary recalculations
  const userRole = user?.role;
  const menuItems = useMemo(() => {
    if (!userRole) return [];
    return getMenuItems(userRole);
  }, [userRole]);

  // Convert menu items to Ant Design Menu items format - memoized with stable references
  const antdMenuItems: MenuProps['items'] = useMemo(() => {
    if (menuItems.length === 0) return [];
    
    return menuItems.map((item) => ({
      key: item.key,
      icon: item.icon,
      label: item.label,
      children: item.children?.map((child) => ({
        key: child.key,
        label: child.label,
      })),
    }));
  }, [menuItems]);

  // Handle menu item click - optimized to reduce memory usage
  const handleMenuClick = useMemo(() => {
    // Create path finding function once
    const findPath = (items: typeof menuItems, targetKey: string): string | undefined => {
      for (const item of items) {
        if (item.key === targetKey) return item.path;
        if (item.children) {
          const childPath = findPath(item.children, targetKey);
          if (childPath) return childPath;
        }
      }
      return undefined;
    };

    return ({ key }: { key: string }) => {
      // Reduce console logging to prevent memory buildup
      if (process.env.NODE_ENV === 'development') {
        console.log('🎯 Menu navigation:', key);
      }
      
      const path = findPath(menuItems, key);
      if (path) {
        router.push(path);
      } else if (process.env.NODE_ENV === 'development') {
        console.warn('No path found for menu key:', key);
      }
    };
  }, [menuItems, router]);

  // State for managing open/closed submenus
  const [openKeys, setOpenKeys] = React.useState<string[]>([]);

  // Get selected key and open parent key based on current pathname - optimized for performance
  const { selectedKey, defaultOpenKey } = useMemo(() => {
    if (menuItems.length === 0) {
      return { selectedKey: undefined, defaultOpenKey: undefined };
    }

    let foundKey: string | undefined;
    let parentKey: string | undefined;

    // Optimize path matching by avoiding repeated string operations
    for (const item of menuItems) {
      // Check children first for more specific matches
      if (item.children) {
        for (const child of item.children) {
          if (pathname === child.path) {
            foundKey = child.key;
            parentKey = item.key;
            break;
          }
        }
        if (foundKey) break;
      }

      // Check exact parent match only
      if (pathname === item.path) {
        foundKey = item.key;
        break;
      }
    }

    return { 
      selectedKey: foundKey, 
      defaultOpenKey: parentKey 
    };
  }, [pathname, menuItems]);

  // Update open keys when the default changes
  React.useEffect(() => {
    if (defaultOpenKey && !openKeys.includes(defaultOpenKey)) {
      setOpenKeys(prev => [...prev, defaultOpenKey]);
    }
  }, [defaultOpenKey, openKeys]);

  // Handle submenu open/close
  const handleOpenChange = useMemo(() => {
    return (keys: string[]) => {
      setOpenKeys(keys);
    };
  }, []);

  // Get role display info
  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'ROLE_ADMIN':
        return { icon: <CrownOutlined />, title: 'Administrator', color: '#ff6b6b' };
      case 'ROLE_MANAGER':
        return { icon: <TeamOutlined />, title: 'Manager', color: '#4ecdc4' };
      default:
        return { icon: <UserOutlined />, title: 'Employee', color: '#45b7d1' };
    }
  };

  const roleInfo = getRoleInfo(userRole || '');

  // Early return for better performance
  if (!user || !userRole) {
    return (
      <Sider 
        collapsed={collapsed} 
        breakpoint="lg" 
        className="!bg-white !border-r !border-gray-200"
        width={250}
      >
        <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <TeamOutlined className="text-white text-xl" />
            </div>
            {!collapsed && (
              <div>
                <div className="text-lg font-bold text-gray-800">HR System</div>
                <div className="text-xs text-gray-500">Loading...</div>
              </div>
            )}
          </div>
        </div>
      </Sider>
    );
  }

  return (
    <Sider 
      collapsed={collapsed} 
      breakpoint="lg" 
      className="!bg-white !border-r !border-gray-200 !shadow-sm"
      width={250}
    >
      {/* Brand Section */}
      <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <TeamOutlined className="text-white text-xl" />
          </div>
          {!collapsed && (
            <div>
              <div className="text-lg font-bold text-gray-800">HR System</div>
              <div className="text-xs text-gray-500">Professional Edition</div>
            </div>
          )}
        </div>
      </div>

      {/* User Profile Section */}
      {!collapsed && (
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <Avatar 
              style={{ backgroundColor: roleInfo.color }}
              icon={roleInfo.icon}
              size={45}
              className="shadow-md"
            />
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-800 truncate">
                {user.name || user.email}
              </div>
              <Badge 
                color={roleInfo.color} 
                text={
                  <span className="text-xs text-gray-600 font-medium">
                    {roleInfo.title}
                  </span>
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <style jsx global>{`
          .sidebar-menu .ant-menu-item {
            margin: 4px 12px !important;
            border-radius: 8px !important;
            color: #6b7280 !important;
            font-weight: 500 !important;
            height: 42px !important;
            line-height: 42px !important;
            transition: all 0.2s ease !important;
            padding-left: 12px !important;
          }
          .sidebar-menu .ant-menu-item:hover {
            background: #f3f4f6 !important;
            color: #2563eb !important;
          }
          .sidebar-menu .ant-menu-item-selected {
            background: #dbeafe !important;
            color: #1d4ed8 !important;
            font-weight: 600 !important;
          }
          .sidebar-menu .ant-menu-submenu-title {
            margin: 4px 12px !important;
            border-radius: 8px !important;
            color: #6b7280 !important;
            font-weight: 500 !important;
            height: 42px !important;
            line-height: 42px !important;
            transition: all 0.2s ease !important;
            padding-left: 12px !important;
          }
          .sidebar-menu .ant-menu-submenu-title:hover {
            background: #f3f4f6 !important;
            color: #2563eb !important;
          }
          .sidebar-menu .ant-menu-submenu-open > .ant-menu-submenu-title {
            color: #2563eb !important;
            background: #f0f9ff !important;
            font-weight: 600 !important;
          }
          .sidebar-menu .ant-menu-sub .ant-menu-item {
            margin-left: 16px !important;
            padding-left: 48px !important;
            height: 38px !important;
            line-height: 38px !important;
          }
          .sidebar-menu .ant-menu-item .anticon,
          .sidebar-menu .ant-menu-submenu-title .anticon {
            font-size: 18px !important;
            margin-right: 8px !important;
          }
          .sidebar-menu::-webkit-scrollbar {
            display: none;
          }
          .sidebar-menu {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        <Menu
          mode="inline"
          selectedKeys={selectedKey ? [selectedKey] : []}
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
          items={antdMenuItems}
          onClick={handleMenuClick}
          className="sidebar-menu !border-none !bg-transparent"
        />
      </div>

      {/* Footer Section */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-600 hover:text-blue-600 cursor-pointer transition-all duration-200 p-2 rounded-lg hover:bg-blue-50">
              <BellOutlined className="text-base" />
              <span className="text-sm font-medium">3 Notifications</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 hover:text-blue-600 cursor-pointer transition-all duration-200 p-2 rounded-lg hover:bg-blue-50">
              <SettingOutlined className="text-base" />
              <span className="text-sm font-medium">Settings</span>
            </div>
          </div>
        </div>
      )}
    </Sider>
  );
};

// Memoized export to prevent unnecessary re-renders
export const Sidebar = React.memo(SidebarComponent);
