'use client'

import React from 'react'
import { Button, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  EyeOutlined,
  DollarOutlined,
  BankOutlined,
  ClockCircleOutlined,
  CalculatorOutlined,
  CheckOutlined,
} from '@ant-design/icons'
import { EnhancedTable } from '@/components/ui'
import { useTranslations } from 'next-intl'
import dayjs from 'dayjs'

interface SalaryRecord {
  id: number
  employeeId: number
  employeeName: string
  employeeCode: string
  department: string
  month: number
  year: number
  baseSalary: string
  totalBonuses: string
  totalAllowances: string
  overtimePay: string
  totalDeductions: string
  absenceDeductions: string
  latencyDeductions: string
  taxDeduction: string
  grossSalary: string
  netSalary: string
  status: 'draft' | 'calculated' | 'approved' | 'paid'
  calculatedAt: string
  approvedAt?: string
  paidAt?: string
}

interface SalaryTableProps {
  data: SalaryRecord[]
  loading: boolean
  pagination: {
    current: number
    pageSize: number
    total: number
  }
  onTableChange: (pagination: any) => void
  onViewDetails: (record: SalaryRecord) => void
}

export const SalaryTable: React.FC<SalaryTableProps> = ({
  data,
  loading,
  pagination,
  onTableChange,
  onViewDetails,
}) => {
  const t = useTranslations()

  const getStatusTag = (status: string) => {
    const statusConfig = {
      draft: { color: 'default', icon: <ClockCircleOutlined />, label: t('salary.draft') },
      calculated: { color: 'processing', icon: <CalculatorOutlined />, label: t('salary.calculated') },
      approved: { color: 'success', icon: <CheckOutlined />, label: t('salary.approved') },
      paid: { color: 'success', icon: <DollarOutlined />, label: t('salary.paid') }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return <Tag icon={config.icon} color={config.color}>{config.label.toUpperCase()}</Tag>
  }
  
  const columns: ColumnsType<SalaryRecord> = [
    {
      title: t('salary.employee'),
      key: 'employee',
      fixed: 'left',
      width: 200,
      render: (_, record) => (
        <div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">{record.employeeName}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{record.employeeCode}</div>
        </div>
      ),
    },
    {
      title: t('salary.department'),
      dataIndex: 'department',
      key: 'department',
      width: 150,
      render: (dept) => (
        <div className="flex items-center gap-2">
          <BankOutlined className="text-gray-400" />
          <Tag color="blue">{dept}</Tag>
        </div>
      ),
    },
    {
      title: t('salary.period'),
      key: 'period',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <div className="font-medium">
          {dayjs().month(record.month - 1).format('MMM')} {record.year}
        </div>
      ),
    },
    {
      title: t('salary.baseSalary'),
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      width: 130,
      align: 'right',
      render: (value) => {
        const amount = Math.max(0, parseFloat(value) || 0);
        return <span className="font-medium">${amount.toLocaleString()}</span>;
      },
    },
    {
      title: t('salary.bonuses'),
      dataIndex: 'totalBonuses',
      key: 'totalBonuses',
      width: 120,
      align: 'right',
      render: (value) => {
        const amount = Math.max(0, parseFloat(value) || 0);
        return (
          <span className="text-green-600 dark:text-green-400 font-medium">
            +${amount.toLocaleString()}
          </span>
        );
      },
    },
    {
      title: t('salary.overtime'),
      dataIndex: 'overtimePay',
      key: 'overtimePay',
      width: 120,
      align: 'right',
      render: (value) => {
        const amount = Math.max(0, parseFloat(value) || 0);
        return (
          <span className="text-blue-600 dark:text-blue-400 font-medium">
            +${amount.toLocaleString()}
          </span>
        );
      },
    },
    {
      title: t('salary.deductions'),
      key: 'deductions',
      width: 130,
      align: 'right',
      render: (_, record) => {
        const total = Math.max(0, parseFloat(record.totalDeductions) || 0);
        const absence = Math.max(0, parseFloat(record.absenceDeductions) || 0);
        const latency = Math.max(0, parseFloat(record.latencyDeductions) || 0);
        const tax = Math.max(0, parseFloat(record.taxDeduction) || 0);
        
        return (
          <Tooltip title={
            <div className="text-xs">
              <div>{t('attendance.absence')}: ${absence.toFixed(2)}</div>
              <div>{t('attendance.late')}: ${latency.toFixed(2)}</div>
              <div>{t('common.tax')}: ${tax.toFixed(2)}</div>
            </div>
          }>
            <span className="text-red-600 dark:text-red-400 font-medium cursor-help">
              -${total.toLocaleString()}
            </span>
          </Tooltip>
        )
      },
    },
    {
      title: t('salary.netSalary'),
      dataIndex: 'netSalary',
      key: 'netSalary',
      width: 150,
      align: 'right',
      render: (value) => {
        // Ensure net salary is never displayed as negative
        const amount = Math.max(0, parseFloat(value) || 0);
        return (
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            ${amount.toLocaleString()}
          </span>
        );
      },
    },
    {
      title: t('salary.status'),
      key: 'status',
      dataIndex: 'status',
      width: 120,
      align: 'center',
      render: (status) => getStatusTag(status),
    },
    {
      title: t('salary.actions'),
      key: 'actions',
      fixed: 'right',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Tooltip title={t('salary.viewDetails')}>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onViewDetails(record)}
            className="hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          />
        </Tooltip>
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
        ...pagination,
        showTotal: (total) => t('salary.totalRecords', { total }),
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
      }}
      onChange={onTableChange}
      scroll={{ x: 1400 }}
    />
  )
}
