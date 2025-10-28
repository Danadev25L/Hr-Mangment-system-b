'use client';

import React from 'react';
import { Select, Card, Space, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/src/store/useAuthStore';
import { UserRole } from '@/src/types';

const { Text } = Typography;

export const RoleSwitcher: React.FC = () => {
  const { user, setRole } = useAuthStore();

  const handleRoleChange = (role: UserRole) => {
    setRole(role);
    // Force reload to update menu items
    window.location.reload();
  };

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Space>
        <UserOutlined />
        <Text strong>Switch Role (Testing):</Text>
        <Select
          value={user?.role}
          onChange={handleRoleChange}
          style={{ width: 150 }}
          options={[
            { value: 'admin', label: 'Admin' },
            { value: 'manager', label: 'Manager' },
            { value: 'employee', label: 'Employee' },
          ]}
        />
      </Space>
    </Card>
  );
};
