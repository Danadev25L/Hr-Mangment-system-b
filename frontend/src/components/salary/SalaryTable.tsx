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

const getStatusTag = (status: string) => {
  const statusConfig = {
    draft: { color: 'default', icon: <ClockCircleOutlined />, label: 'Draft' },
    calculated: { color: 'processing', icon: <CalculatorOutlined />, label: 'Calculated' },
    approved: { color: 'success', icon: <CheckOutlined />, label: 'Approved' },
    paid: { color: 'success', icon: <DollarOutlined />, label: 'Paid' }
  }
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
  return <Tag icon={config.icon} color={config.color}>{config.label.toUpperCase()}</Tag>
}

export const SalaryTable: React.FC<SalaryTableProps> = ({
  data,
  loading,
  pagination,
  onTableChange,
  onViewDetails,
}) => {
  const columns: ColumnsType<SalaryRecord> = [
    {
      title: 'Employee',
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
      title: 'Department',
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
      title: 'Period',
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
      title: 'Base Salary',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      width: 130,
      align: 'right',
      render: (value) => (
        <span className="font-medium">${parseFloat(value).toLocaleString()}</span>
      ),
    },
    {
      title: 'Bonuses',
      dataIndex: 'totalBonuses',
      key: 'totalBonuses',
      width: 120,
      align: 'right',
      render: (value) => (
        <span className="text-green-600 dark:text-green-400 font-medium">
          +${parseFloat(value).toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Overtime',
      dataIndex: 'overtimePay',
      key: 'overtimePay',
      width: 120,
      align: 'right',
      render: (value) => (
        <span className="text-blue-600 dark:text-blue-400 font-medium">
          +${parseFloat(value).toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Deductions',
      key: 'deductions',
      width: 130,
      align: 'right',
      render: (_, record) => {
        const total = parseFloat(record.totalDeductions)
        const absence = parseFloat(record.absenceDeductions)
        const latency = parseFloat(record.latencyDeductions)
        const tax = parseFloat(record.taxDeduction)
        
        return (
          <Tooltip title={
            <div className="text-xs">
              <div>Absence: ${absence.toFixed(2)}</div>
              <div>Latency: ${latency.toFixed(2)}</div>
              <div>Tax: ${tax.toFixed(2)}</div>
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
      title: 'Net Salary',
      dataIndex: 'netSalary',
      key: 'netSalary',
      width: 150,
      align: 'right',
      render: (value) => (
        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
          ${parseFloat(value).toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      align: 'center',
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Tooltip title="View Details">
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
        showTotal: (total) => `Total ${total} records`,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
      }}
      onChange={onTableChange}
      scroll={{ x: 1400 }}
    />
  )
}
