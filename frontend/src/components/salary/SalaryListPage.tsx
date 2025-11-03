'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Table, 
  Button, 
  Select, 
  Card,
  Statistic,
  Row,
  Col,
  Space,
  Tag,
  Tooltip,
  Modal,
  Descriptions,
  Divider,
  message,
  Spin,
  Empty
} from 'antd'
import {
  DollarOutlined,
  EyeOutlined,
  TeamOutlined,
  ReloadOutlined,
  PrinterOutlined,
  DownloadOutlined,
  ClockCircleOutlined,
  CalculatorOutlined,
  CheckOutlined,
  BankOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import apiClient from '@/lib/api'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

const { Option } = Select

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

interface SalarySummary {
  totalEmployees: number
  totalGrossSalary: number
  totalNetSalary: number
  totalDeductions: number
  totalBonuses: number
  statusBreakdown: {
    draft: number
    calculated: number
    approved: number
    paid: number
  }
}

interface SalaryListProps {
  role: 'ROLE_ADMIN' | 'ROLE_MANAGER'
}

export default function SalaryListPage({ role }: SalaryListProps) {
  const currentDate = dayjs()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.month() + 1)
  const [selectedYear, setSelectedYear] = useState(currentDate.year())
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [detailsModal, setDetailsModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<SalaryRecord | null>(null)

  const isAdmin = role === 'ROLE_ADMIN'

  // Fetch departments (for admin only)
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiClient.getDepartments(),
    enabled: isAdmin
  })

  const departments = Array.isArray(departmentsData) ? departmentsData : []

  // Fetch salary records
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['salary-list', selectedMonth, selectedYear, selectedStatus, selectedDepartment, role],
    queryFn: async () => {
      const response = await apiClient.getMonthlySalaries({
        month: selectedMonth,
        year: selectedYear,
        status: selectedStatus,
        role
      })
      return response
    }
  })

  const salaries: SalaryRecord[] = data?.salaries || []
  const summary: SalarySummary = data?.summary || {
    totalEmployees: 0,
    totalGrossSalary: 0,
    totalNetSalary: 0,
    totalDeductions: 0,
    totalBonuses: 0,
    statusBreakdown: { draft: 0, calculated: 0, approved: 0, paid: 0 }
  }

  // Filter by department if selected
  const filteredSalaries = selectedDepartment 
    ? salaries.filter(s => s.department === selectedDepartment)
    : salaries

  const handleViewDetails = (record: SalaryRecord) => {
    setSelectedRecord(record)
    setDetailsModal(true)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportCSV = () => {
    if (filteredSalaries.length === 0) {
      message.warning('No data to export')
      return
    }

    const headers = [
      'Employee Name',
      'Employee Code',
      'Department',
      'Month',
      'Year',
      'Base Salary',
      'Bonuses',
      'Overtime',
      'Deductions',
      'Gross Salary',
      'Net Salary',
      'Status'
    ]

    const rows = filteredSalaries.map(s => [
      s.employeeName,
      s.employeeCode,
      s.department,
      s.month,
      s.year,
      parseFloat(s.baseSalary).toFixed(2),
      parseFloat(s.totalBonuses).toFixed(2),
      parseFloat(s.overtimePay).toFixed(2),
      parseFloat(s.totalDeductions).toFixed(2),
      parseFloat(s.grossSalary).toFixed(2),
      parseFloat(s.netSalary).toFixed(2),
      s.status
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `salary_report_${selectedMonth}_${selectedYear}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    message.success('CSV exported successfully!')
  }

  const getStatusTag = (status: string) => {
    const statusConfig = {
      draft: { color: 'default', icon: <ClockCircleOutlined /> },
      calculated: { color: 'processing', icon: <CalculatorOutlined /> },
      approved: { color: 'success', icon: <CheckOutlined /> },
      paid: { color: 'success', icon: <DollarOutlined /> }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return <Tag icon={config.icon} color={config.color}>{status.toUpperCase()}</Tag>
  }

  const columns: ColumnsType<SalaryRecord> = [
    {
      title: 'Employee',
      key: 'employee',
      fixed: 'left',
      width: 180,
      render: (_, record) => (
        <div>
          <div className="font-semibold text-gray-900">{record.employeeName}</div>
          <div className="text-xs text-gray-500">{record.employeeCode}</div>
        </div>
      )
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      width: 130,
      render: (dept) => (
        <Tag icon={<BankOutlined />} color="blue">{dept}</Tag>
      )
    },
    {
      title: 'Period',
      key: 'period',
      width: 90,
      align: 'center',
      render: (_, record) => (
        <div className="font-medium">{dayjs().month(record.month - 1).format('MMM')} {record.year}</div>
      )
    },
    {
      title: 'Base Salary',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      width: 110,
      align: 'right',
      render: (value) => <span className="font-medium">${parseFloat(value).toLocaleString()}</span>
    },
    {
      title: 'Bonuses',
      dataIndex: 'totalBonuses',
      key: 'totalBonuses',
      width: 100,
      align: 'right',
      render: (value) => (
        <span className="text-green-600 font-medium">
          +${parseFloat(value).toLocaleString()}
        </span>
      )
    },
    {
      title: 'Overtime',
      dataIndex: 'overtimePay',
      key: 'overtimePay',
      width: 100,
      align: 'right',
      render: (value) => (
        <span className="text-blue-600 font-medium">
          +${parseFloat(value).toLocaleString()}
        </span>
      )
    },
    {
      title: 'Deductions',
      key: 'deductions',
      width: 110,
      align: 'right',
      render: (_, record) => {
        const total = parseFloat(record.totalDeductions)
        const absence = parseFloat(record.absenceDeductions)
        const latency = parseFloat(record.latencyDeductions)
        
        return (
          <Tooltip title={
            <div className="text-xs">
              <div>Absence: ${absence.toFixed(2)}</div>
              <div>Latency: ${latency.toFixed(2)}</div>
              <div>Tax: ${parseFloat(record.taxDeduction).toFixed(2)}</div>
            </div>
          }>
            <span className="text-red-600 font-medium cursor-help">
              -${total.toLocaleString()}
            </span>
          </Tooltip>
        )
      }
    },
    {
      title: 'Final Salary',
      dataIndex: 'netSalary',
      key: 'netSalary',
      width: 140,
      align: 'right',
      render: (value) => (
        <span className="text-lg font-bold text-emerald-600">
          ${parseFloat(value).toLocaleString()}
        </span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      align: 'center',
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Action',
      key: 'actions',
      fixed: 'right',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Tooltip title="View Details">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          />
        </Tooltip>
      )
    }
  ]

  if (isLoading) {
    return (
      <DashboardLayout role={role}>
        <div className="flex items-center justify-center h-96">
          <Spin size="large" tip="Loading salary data..." />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role={role}>
      <div className="p-4 max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">💰 Salary List</h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                View employee salaries with detailed breakdown
              </p>
            </div>
            
            <Space wrap>
              <Button
                icon={<PrinterOutlined />}
                onClick={handlePrint}
                size="large"
              >
                Print
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExportCSV}
                type="primary"
                size="large"
              >
                Export CSV
              </Button>
            </Space>
          </div>
        </div>

        {/* Summary Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-sm">
              <Statistic
                title="Total Employees"
                value={filteredSalaries.length}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff', fontSize: '24px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-sm">
              <Statistic
                title="Total Gross Salary"
                value={summary.totalGrossSalary}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#52c41a', fontSize: '24px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-sm">
              <Statistic
                title="Total Net Salary"
                value={summary.totalNetSalary}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#13c2c2', fontSize: '24px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-sm">
              <Statistic
                title="Total Bonuses"
                value={summary.totalBonuses}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#faad14', fontSize: '24px' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 flex-wrap items-start md:items-center">
            <span className="font-semibold text-gray-700">Filters:</span>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Period:</span>
              <Select
                value={selectedMonth}
                onChange={setSelectedMonth}
                style={{ width: 120 }}
                size="large"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <Option key={month} value={month}>
                    {dayjs().month(month - 1).format('MMMM')}
                  </Option>
                ))}
              </Select>
              <Select
                value={selectedYear}
                onChange={setSelectedYear}
                style={{ width: 90 }}
                size="large"
              >
                {Array.from({ length: 5 }, (_, i) => currentDate.year() - i).map(year => (
                  <Option key={year} value={year}>{year}</Option>
                ))}
              </Select>
            </div>

            {isAdmin && departments.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Department:</span>
                <Select
                  value={selectedDepartment}
                  onChange={setSelectedDepartment}
                  style={{ width: 180 }}
                  placeholder="All Departments"
                  allowClear
                  size="large"
                >
                  {departments.map((dept: any) => (
                    <Option key={dept.id} value={dept.departmentName || dept.name}>
                      {dept.departmentName || dept.name}
                    </Option>
                  ))}
                </Select>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Status:</span>
              <Select
                value={selectedStatus}
                onChange={setSelectedStatus}
                style={{ width: 140 }}
                placeholder="All Status"
                allowClear
                size="large"
              >
                <Option value="draft">Draft</Option>
                <Option value="calculated">Calculated</Option>
                <Option value="approved">Approved</Option>
                <Option value="paid">Paid</Option>
              </Select>
            </div>

            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              size="large"
              className="ml-auto"
            >
              Refresh
            </Button>
          </div>
        </Card>

        {/* Salary Table */}
        <Card className="shadow-sm">
          {filteredSalaries.length === 0 ? (
            <Empty 
              description="No salary records found for the selected period"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table
                columns={columns}
                dataSource={filteredSalaries}
                rowKey="id"
                loading={isLoading}
                scroll={{ x: 1200 }}
                pagination={{
                  pageSize: 20,
                  showTotal: (total) => `Total ${total} employees`,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50', '100']
                }}
                size="middle"
              />
            </div>
          )}
        </Card>

        {/* Details Modal */}
        <Modal
          title={
            <div className="text-lg font-bold">
              Salary Details - {selectedRecord?.employeeName}
            </div>
          }
          open={detailsModal}
          onCancel={() => setDetailsModal(false)}
          width={800}
          footer={
            <Button type="primary" onClick={() => setDetailsModal(false)}>
              Close
            </Button>
          }
        >
          {selectedRecord && (
            <div>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Employee Code">
                  <strong>{selectedRecord.employeeCode}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Department">
                  <Tag color="blue">{selectedRecord.department}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Period">
                  {dayjs().month(selectedRecord.month - 1).format('MMMM')} {selectedRecord.year}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  {getStatusTag(selectedRecord.status)}
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">Earnings</Divider>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Base Salary">
                  <span className="font-semibold">${parseFloat(selectedRecord.baseSalary).toLocaleString()}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Bonuses">
                  <span className="text-green-600 font-semibold">
                    +${parseFloat(selectedRecord.totalBonuses).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Allowances">
                  <span className="text-green-600 font-semibold">
                    +${parseFloat(selectedRecord.totalAllowances).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Overtime Pay">
                  <span className="text-blue-600 font-semibold">
                    +${parseFloat(selectedRecord.overtimePay).toLocaleString()}
                  </span>
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">Deductions</Divider>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Absence Deductions">
                  <span className="text-red-600 font-semibold">
                    -${parseFloat(selectedRecord.absenceDeductions).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Latency Deductions">
                  <span className="text-orange-600 font-semibold">
                    -${parseFloat(selectedRecord.latencyDeductions).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Tax Deduction">
                  <span className="text-red-600 font-semibold">
                    -${parseFloat(selectedRecord.taxDeduction).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Total Deductions">
                  <span className="text-red-600 font-bold text-lg">
                    -${parseFloat(selectedRecord.totalDeductions).toLocaleString()}
                  </span>
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">Final Amount</Divider>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Gross Salary">
                  <span className="text-xl font-bold">
                    ${parseFloat(selectedRecord.grossSalary).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Net Salary (Final)">
                  <span className="text-2xl font-bold text-emerald-600">
                    ${parseFloat(selectedRecord.netSalary).toLocaleString()}
                  </span>
                </Descriptions.Item>
              </Descriptions>

              {selectedRecord.calculatedAt && (
                <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
                  <p><strong>Calculated:</strong> {dayjs(selectedRecord.calculatedAt).format('MMMM D, YYYY h:mm A')}</p>
                  {selectedRecord.approvedAt && (
                    <p><strong>Approved:</strong> {dayjs(selectedRecord.approvedAt).format('MMMM D, YYYY h:mm A')}</p>
                  )}
                  {selectedRecord.paidAt && (
                    <p><strong>Paid:</strong> {dayjs(selectedRecord.paidAt).format('MMMM D, YYYY h:mm A')}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  )
}
