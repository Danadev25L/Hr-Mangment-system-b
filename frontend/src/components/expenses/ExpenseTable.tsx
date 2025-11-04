'use client'

import React from 'react'
import { Dropdown, Button, Space, Tag, Tooltip } from 'antd'
import type { MenuProps } from 'antd'
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  DollarOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  BankOutlined,
} from '@ant-design/icons'
import { EnhancedTable, AvatarWithInitials } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import type { ColumnsType } from 'antd/es/table'
import type { Expense } from './ExpenseListPage'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'

interface ExpenseTableProps {
  data: Expense[]
  loading: boolean
  pagination: {
    current: number
    pageSize: number
    total: number
  }
  onTableChange: (pagination: any) => void
  onView: (expense: Expense) => void
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
  onApprove?: (expense: Expense) => void
  onReject?: (expense: Expense) => void
  onMarkPaid?: (expense: Expense) => void
  role?: 'admin' | 'manager'
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  data,
  loading,
  pagination,
  onTableChange,
  onView,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onMarkPaid,
  role = 'admin',
}) => {
  const locale = useLocale()
  const router = useRouter()

  const getStatusTag = (status: string) => {
    const statusConfig = {
      pending: { color: 'warning', icon: <ClockCircleOutlined />, text: 'Pending' },
      approved: { color: 'success', icon: <CheckCircleOutlined />, text: 'Approved' },
      rejected: { color: 'error', icon: <CloseCircleOutlined />, text: 'Rejected' },
      paid: { color: 'processing', icon: <DollarOutlined />, text: 'Paid' },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text.toUpperCase()}
      </Tag>
    )
  }

  const getActionMenuItems = (record: Expense): MenuProps['items'] => {
    const menuItems: MenuProps['items'] = [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: 'View Details',
        onClick: () => onView(record),
      },
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: 'Edit',
        onClick: () => onEdit(record),
      },
    ]

    if (role === 'admin' && record.status === 'pending') {
      menuItems.push(
        { type: 'divider' },
        {
          key: 'approve',
          icon: <CheckCircleOutlined />,
          label: 'Approve',
          onClick: () => onApprove?.(record),
        },
        {
          key: 'reject',
          icon: <CloseCircleOutlined />,
          label: 'Reject',
          onClick: () => onReject?.(record),
        }
      )
    }

    if (role === 'admin' && record.status === 'approved') {
      menuItems.push(
        { type: 'divider' },
        {
          key: 'paid',
          icon: <DollarOutlined />,
          label: 'Mark as Paid',
          onClick: () => onMarkPaid?.(record),
        }
      )
    }

    menuItems.push(
      { type: 'divider' },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Delete',
        danger: true,
        onClick: () => onDelete(record),
      }
    )

    return menuItems
  }

  const columns: ColumnsType<Expense> = [
    {
      title: (
        <Space>
          <DollarOutlined />
          <span>Submitted By</span>
        </Space>
      ),
      key: 'userName',
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <AvatarWithInitials name={record.userName} size="lg" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {record.userName}
            </p>
          </div>
        </div>
      ),
      width: 200,
    },
    ...(role === 'admin'
      ? [
          {
            title: (
              <Space>
                <BankOutlined />
                <span>Department</span>
              </Space>
            ),
            key: 'department',
            render: (_: any, record: Expense) => {
              const deptName = record.departmentName || 'Company-wide'
              return (
                <div className="flex items-center gap-2">
                  <BankOutlined className="text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">{deptName}</span>
                </div>
              )
            },
            width: 180,
          },
        ]
      : []),
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (reason: string) => (
        <Tooltip title={reason}>
          <span className="text-gray-700 dark:text-gray-300">{reason}</span>
        </Tooltip>
      ),
    },
    {
      title: (
        <Space>
          <DollarOutlined />
          <span>Amount</span>
        </Space>
      ),
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      render: (amount: number) => (
        <span className="font-semibold text-green-600 dark:text-green-400">
          ${amount.toFixed(2)}
        </span>
      ),
      sorter: (a, b) => Number(a.amount) - Number(b.amount),
    },
    {
      title: (
        <Space>
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span>Status</span>
        </Space>
      ),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => getStatusTag(status),
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Approved', value: 'approved' },
        { text: 'Rejected', value: 'rejected' },
        { text: 'Paid', value: 'paid' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: (
        <Space>
          <CalendarOutlined />
          <span>Date</span>
        </Space>
      ),
      dataIndex: 'date',
      key: 'date',
      width: 140,
      render: (date: string) => (
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <CalendarOutlined className="text-xs" />
          <span>{dayjs(date).format('MMM DD, YYYY')}</span>
        </div>
      ),
      sorter: (a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
              size="small"
              className="hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
              size="small"
              className="hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
            />
          </Tooltip>
          <Dropdown menu={{ items: getActionMenuItems(record) }} trigger={['click']}>
            <Button
              type="text"
              icon={<MoreOutlined />}
              size="small"
              className="hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20"
            />
          </Dropdown>
        </Space>
      ),
    },
  ]

  return (
    <EnhancedTable
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} expenses`,
      }}
      onChange={onTableChange}
      scroll={{ x: 1200 }}
      variant="striped"
    />
  )
}
