'use client'

import React from 'react'
import { Tag } from 'antd'
import {
  CrownOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'

interface RoleBadgeProps {
  role: string
  size?: 'small' | 'default' | 'large'
  showIcon?: boolean
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  size = 'default',
  showIcon = true,
}) => {
  const roleConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    ROLE_ADMIN: {
      color: 'red',
      icon: <CrownOutlined />,
      label: 'Admin',
    },
    ROLE_MANAGER: {
      color: 'blue',
      icon: <TeamOutlined />,
      label: 'Manager',
    },
    ROLE_EMPLOYEE: {
      color: 'green',
      icon: <UserOutlined />,
      label: 'Employee',
    },
    admin: {
      color: 'red',
      icon: <CrownOutlined />,
      label: 'Admin',
    },
    manager: {
      color: 'blue',
      icon: <TeamOutlined />,
      label: 'Manager',
    },
    employee: {
      color: 'green',
      icon: <UserOutlined />,
      label: 'Employee',
    },
  }

  const config = roleConfig[role] || {
    color: 'default',
    icon: <UserOutlined />,
    label: role,
  }

  const sizeClass = size === 'large' ? 'text-base px-3 py-1' : size === 'small' ? 'text-xs' : ''

  return (
    <Tag
      color={config.color}
      icon={showIcon ? config.icon : undefined}
      className={`rounded-md font-medium ${sizeClass}`}
    >
      {config.label}
    </Tag>
  )
}
