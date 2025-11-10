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
import { EnhancedTable, AvatarWithInitials, CustomSpinner } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import type { ColumnsType } from 'antd/es/table'
import type { Expense } from './ExpenseListPage'
import { useLocale, useTranslations } from 'next-intl'
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
  const t = useTranslations()

  const getStatusTag = (status: string) => {
    const statusConfig = {
      pending: { color: 'warning', icon: <ClockCircleOutlined />, text: t('expenses.pending') },
      approved: { color: 'success', icon: <CheckCircleOutlined />, text: t('expenses.approved') },
      rejected: { color: 'error', icon: <CloseCircleOutlined />, text: t('expenses.rejected') },
      paid: { color: 'processing', icon: <DollarOutlined />, text: t('expenses.paid') },
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
        label: t('expenses.table.viewDetails'),
        onClick: () => onView(record),
      },
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: t('common.edit'),
        onClick: () => onEdit(record),
      },
    ]

    if (role === 'admin' && record.status === 'pending') {
      menuItems.push(
        { type: 'divider' },
        {
          key: 'approve',
          icon: <CheckCircleOutlined />,
          label: t('expenses.approve'),
          onClick: () => onApprove?.(record),
        },
        {
          key: 'reject',
          icon: <CloseCircleOutlined />,
          label: t('expenses.reject'),
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
          label: t('expenses.markAsPaid'),
          onClick: () => onMarkPaid?.(record),
        }
      )
    }

    menuItems.push(
      { type: 'divider' },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: t('common.delete'),
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
          <span>{t('expenses.submittedBy')}</span>
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
                <span>{t('expenses.department')}</span>
              </Space>
            ),
            key: 'department',
            render: (_: any, record: Expense) => {
              const deptName = record.departmentName || t('expenses.companyWide')
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
      title: t('expenses.reason'),
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
          <span>{t('expenses.amount')}</span>
        </Space>
      ),
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      render: (amount: number) => (
        <span className="font-semibold text-green-600 dark:text-green-400">
          {t('expenses.amountValue', { amount: amount.toFixed(2) })}
        </span>
      ),
      sorter: (a, b) => Number(a.amount) - Number(b.amount),
    },
    {
      title: (
        <Space>
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span>{t('expenses.status')}</span>
        </Space>
      ),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => getStatusTag(status),
      filters: [
        { text: t('expenses.pending'), value: 'pending' },
        { text: t('expenses.approved'), value: 'approved' },
        { text: t('expenses.rejected'), value: 'rejected' },
        { text: t('expenses.paid'), value: 'paid' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: (
        <Space>
          <CalendarOutlined />
          <span>{t('expenses.date')}</span>
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
      title: t('common.actions'),
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('expenses.table.view')}>
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
              size="small"
              className="hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            />
          </Tooltip>
          <Tooltip title={t('expenses.table.edit')}>
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
      loading={{
        spinning: loading,
        indicator: <CustomSpinner text={t('expenses.table.loadingExpenses')} />,
      }}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: true,
        showTotal: (total, range) => t('expenses.table.showingExpenses', { 
          start: range[0], 
          end: range[1], 
          total 
        }),
      }}
      onChange={onTableChange}
      scroll={{ x: 1200 }}
      variant="striped"
    />
  )
}
