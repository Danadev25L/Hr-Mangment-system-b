'use client'

import { Table, Tag, Button, Dropdown, Space, Modal, Input } from 'antd'
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  MoreOutlined,
  FlagOutlined,
} from '@ant-design/icons'
import { AvatarWithInitials } from '@/components/ui'
import dayjs from 'dayjs'
import type { MenuProps } from 'antd'
import { useTranslations } from 'next-intl'

export interface Application {
  id: number
  userId: number
  userName: string
  departmentId: number | null
  departmentName: string
  title: string
  applicationType: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'approved' | 'rejected'
  startDate: string
  endDate: string
  reason: string
  createdAt: string
}

interface ApplicationTableProps {
  data: Application[]
  loading: boolean
  pagination: {
    current: number
    pageSize: number
    total: number
  }
  onPaginationChange: (page: number, pageSize: number) => void
  onView: (record: Application) => void
  onEdit: (record: Application) => void
  onDelete: (record: Application) => void
  onApprove: (record: Application) => void
  onReject: (record: Application) => void
  role: 'admin' | 'manager' | 'employee'
}

export function ApplicationTable({
  data,
  loading,
  pagination,
  onPaginationChange,
  onView,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  role,
}: ApplicationTableProps) {
  const t = useTranslations('applications')
  
  const getStatusTag = (status: string) => {
    const statusConfig = {
      pending: { color: 'orange', icon: <ClockCircleOutlined />, label: t('pending') },
      approved: { color: 'green', icon: <CheckCircleOutlined />, label: t('approved') },
      rejected: { color: 'red', icon: <CloseCircleOutlined />, label: t('rejected') },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return (
      <Tag color={config.color} icon={config.icon} className="font-medium">
        {config.label.toUpperCase()}
      </Tag>
    )
  }

  const getPriorityTag = (priority: string) => {
    const priorityConfig = {
      low: { color: 'default', label: t('low') },
      medium: { color: 'blue', label: t('medium') },
      high: { color: 'orange', label: t('high') },
      urgent: { color: 'red', label: t('urgent') },
    }
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low
    return (
      <Tag color={config.color} icon={<FlagOutlined />} className="font-medium">
        {config.label.toUpperCase()}
      </Tag>
    )
  }

  const getTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      leave: t('leave'),
      overtime: t('overtime'),
      remote: t('remoteWork'),
      other: t('other'),
    }
    return typeLabels[type] || type
  }

  const columns: any[] = [
    {
      title: t('submittedBy'),
      dataIndex: 'userName',
      key: 'userName',
      width: 200,
      render: (text: string) => (
        <div className="flex items-center space-x-3">
          <AvatarWithInitials name={text} size="md" />
          <span className="font-medium text-gray-700 dark:text-gray-300">{text}</span>
        </div>
      ),
    },
    ...(role === 'admin'
      ? [
          {
            title: t('department'),
            dataIndex: 'departmentName',
            key: 'departmentName',
            width: 150,
            render: (text: string) => (
              <span className="text-gray-600 dark:text-gray-400">{text || t('na')}</span>
            ),
          },
        ]
      : []),
    {
      title: t('title'),
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
      render: (text: string) => (
        <span className="font-medium text-gray-700 dark:text-gray-300">{text}</span>
      ),
    },
    {
      title: t('type'),
      dataIndex: 'applicationType',
      key: 'applicationType',
      width: 120,
      render: (text: string) => (
        <Tag color="blue" className="font-medium">
          {getTypeLabel(text).toUpperCase()}
        </Tag>
      ),
    },
    {
      title: t('priority'),
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => getPriorityTag(priority),
    },
    {
      title: t('status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: t('startDate'),
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      render: (date: string) => (
        <span className="text-gray-600 dark:text-gray-400">
          {dayjs(date).format('MMM DD, YYYY')}
        </span>
      ),
    },
    {
      title: t('actions'),
      key: 'actions',
      width: 80,
      fixed: 'right' as const,
      render: (_: any, record: Application) => {
        const menuItems: MenuProps['items'] = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: t('viewDetails'),
            onClick: () => onView(record),
          },
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: t('edit'),
            onClick: () => onEdit(record),
          },
          ...(record.status === 'pending'
            ? [
                { type: 'divider' as const },
                {
                  key: 'approve',
                  icon: <CheckCircleOutlined />,
                  label: t('approve'),
                  onClick: () => onApprove(record),
                },
                {
                  key: 'reject',
                  icon: <CloseCircleOutlined />,
                  label: t('reject'),
                  onClick: () => onReject(record),
                },
              ]
            : []),
          { type: 'divider' as const },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            danger: true,
            label: t('delete'),
            onClick: () => onDelete(record),
          },
        ]

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <Button
              type="text"
              icon={<MoreOutlined />}
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
            />
          </Dropdown>
        )
      },
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: true,
        showTotal: (total) => t('totalApplications', { count: total }),
        onChange: onPaginationChange,
        showQuickJumper: true,
      }}
      scroll={{ x: 1200 }}
      className="shadow-sm"
    />
  )
}
