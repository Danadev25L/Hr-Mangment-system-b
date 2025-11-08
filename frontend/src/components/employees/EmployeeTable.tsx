'use client'

import React from 'react'
import { Dropdown, Button, Space, Avatar, Tag, Tooltip } from 'antd'
import type { MenuProps } from 'antd'
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  UserOutlined,
  IdcardOutlined,
  MailOutlined,
  CalendarOutlined,
  BankOutlined,
} from '@ant-design/icons'
import { EnhancedTable, AvatarWithInitials, StatusBadge, RoleBadge, CustomSpinner } from '@/components/ui'
import { formatDate, getInitials, getRoleColor, getRoleLabel } from '@/lib/utils'
import type { ColumnsType } from 'antd/es/table'
import type { User } from '@/types'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

interface EmployeeTableProps {
  data: User[]
  loading: boolean
  pagination: {
    current: number
    pageSize: number
    total: number
  }
  onTableChange: (pagination: any) => void
  onView: (employee: User) => void
  onEdit: (employee: User) => void
  onDelete: (employee: User) => void
  role?: 'admin' | 'manager'
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  data,
  loading,
  pagination,
  onTableChange,
  onView,
  onEdit,
  onDelete,
  role = 'admin',
}) => {
  const locale = useLocale()
  const router = useRouter()
  const t = useTranslations()
  
  const getActionMenuItems = (record: User): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: t('employees.viewDetails'),
      onClick: () => onView(record),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: t('common.edit'),
      onClick: () => onEdit(record),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: t('common.delete'),
      danger: true,
      onClick: () => onDelete(record),
    },
  ]

  const columns: ColumnsType<User> = [
    {
      title: (
        <Space>
          <UserOutlined />
          <span>{t('employees.employee')}</span>
        </Space>
      ),
      key: 'user',
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <AvatarWithInitials name={record.fullName} size="lg" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {record.fullName}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <MailOutlined className="text-xs" />
              {record.email}
            </p>
          </div>
        </div>
      ),
      width: 300,
    },
    {
      title: (
        <Space>
          <IdcardOutlined />
          <span>{t('employees.employeeCode')}</span>
        </Space>
      ),
      dataIndex: 'employeeCode',
      key: 'employeeCode',
      render: (code) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg font-semibold border border-blue-200 dark:border-blue-800">
            {code || t('common.notAvailable')}
          </span>
        </div>
      ),
    },
    {
      title: (
        <Space>
          <UserOutlined />
          <span>{t('employees.role')}</span>
        </Space>
      ),
      dataIndex: 'role',
      key: 'role',
      render: (role) => <RoleBadge role={role} />,
      filters: [
        { text: t('employees.admin'), value: 'ROLE_ADMIN' },
        { text: t('employees.manager'), value: 'ROLE_MANAGER' },
        { text: t('employees.roleEmployee'), value: 'ROLE_EMPLOYEE' },
      ],
      onFilter: (value, record) => record.role === value,
    },
    {
      title: (
        <Space>
          <BankOutlined />
          <span>{t('employees.department')}</span>
        </Space>
      ),
      key: 'department',
      render: (_, record) => {
        const deptName = typeof record.department === 'string' 
          ? record.department 
          : record.department?.departmentName || t('common.notAvailable')
        return (
          <div className="flex items-center gap-2">
            <BankOutlined className="text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300">{deptName}</span>
          </div>
        )
      },
    },
    {
      title: (
        <Space>
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span>{t('common.status')}</span>
        </Space>
      ),
      dataIndex: 'active',
      key: 'active',
      render: (active) => <StatusBadge status={active ? 'active' : 'inactive'} />,
      filters: [
        { text: t('employees.active'), value: true },
        { text: t('employees.inactive'), value: false },
      ],
      onFilter: (value, record) => record.active === value,
    },
    {
      title: (
        <Space>
          <CalendarOutlined />
          <span>{t('employees.joinedDate')}</span>
        </Space>
      ),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <CalendarOutlined className="text-xs" />
          <span>{formatDate(date)}</span>
        </div>
      ),
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('employees.view')}>
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
              size="small"
              className="hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            />
          </Tooltip>
          <Tooltip title={t('employees.edit')}>
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
        indicator: <CustomSpinner text={t('employees.loadingEmployees')} />,
      }}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: true,
        showTotal: (total, range) => t('employees.showingResults', { 
          from: range[0], 
          to: range[1], 
          total 
        }),
      }}
      onChange={onTableChange}
      scroll={{ x: 1200 }}
      variant="striped"
    />
  )
}
