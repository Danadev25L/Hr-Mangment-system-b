'use client';

import React from 'react';
import { Layout, Avatar, Dropdown, Space } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { NotificationBell } from '../NotificationBell';

const { Header } = Layout;

interface DashboardHeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  collapsed,
  onToggle,
}) => {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => router.push('/dashboard/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <Header
      style={{
        padding: '0 24px',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #f0f0f0',
        position: 'sticky',
        top: 0,
        zIndex: 1,
      }}
    >
      <div
        onClick={onToggle}
        style={{ fontSize: 18, cursor: 'pointer' }}
      >
        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </div>

      <Space size="large">
        <NotificationBell />
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} src={user?.avatar} />
            <span>{user?.name || user?.email}</span>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
};
