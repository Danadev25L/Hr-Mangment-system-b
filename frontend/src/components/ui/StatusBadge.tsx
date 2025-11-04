'use client'

import React from 'react'
import { Tag } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons'

interface StatusBadgeProps {
  status: string
  size?: 'small' | 'default' | 'large'
  showIcon?: boolean
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'default',
  showIcon = true,
}) => {
  const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    // General statuses
    active: {
      color: 'green',
      icon: <CheckCircleOutlined />,
      label: 'Active',
    },
    inactive: {
      color: 'red',
      icon: <CloseCircleOutlined />,
      label: 'Inactive',
    },
    pending: {
      color: 'orange',
      icon: <ClockCircleOutlined />,
      label: 'Pending',
    },
    approved: {
      color: 'green',
      icon: <CheckCircleOutlined />,
      label: 'Approved',
    },
    rejected: {
      color: 'red',
      icon: <CloseCircleOutlined />,
      label: 'Rejected',
    },
    completed: {
      color: 'blue',
      icon: <CheckCircleOutlined />,
      label: 'Completed',
    },
    cancelled: {
      color: 'default',
      icon: <MinusCircleOutlined />,
      label: 'Cancelled',
    },
    processing: {
      color: 'blue',
      icon: <SyncOutlined spin />,
      label: 'Processing',
    },
    // Payment statuses
    paid: {
      color: 'green',
      icon: <CheckCircleOutlined />,
      label: 'Paid',
    },
    unpaid: {
      color: 'red',
      icon: <ExclamationCircleOutlined />,
      label: 'Unpaid',
    },
    // Application statuses
    PENDING: {
      color: 'orange',
      icon: <ClockCircleOutlined />,
      label: 'Pending',
    },
    APPROVED: {
      color: 'green',
      icon: <CheckCircleOutlined />,
      label: 'Approved',
    },
    REJECTED: {
      color: 'red',
      icon: <CloseCircleOutlined />,
      label: 'Rejected',
    },
  }

  const config = statusConfig[status] || statusConfig[status?.toLowerCase()] || {
    color: 'default',
    icon: <ExclamationCircleOutlined />,
    label: status,
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
