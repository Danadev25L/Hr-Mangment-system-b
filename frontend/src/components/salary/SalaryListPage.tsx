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
import { useTranslations } from 'next-intl'
import { CustomSpinner } from '@/components/ui'

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
  const t = useTranslations()
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
      message.warning(t('common.noDataToExport'))
      return
    }

    const headers = [
      t('employees.employeeName'),
      t('common.employeeCode'),
      t('employees.department'),
      t('common.month'),
      t('common.year'),
      t('common.baseSalary'),
      t('common.bonuses'),
      t('common.overtime'),
      t('common.deductions'),
      t('common.grossSalary'),
      t('common.netSalary'),
      t('common.status')
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
    
    message.success(t('common.exportSuccess'))
  }

  const getStatusTag = (status: string) => {
    const statusConfig = {
      draft: { color: 'default', icon: <ClockCircleOutlined />, label: t('common.draft') },
      calculated: { color: 'processing', icon: <CalculatorOutlined />, label: t('common.calculated') },
      approved: { color: 'success', icon: <CheckOutlined />, label: t('applications.approved') },
      paid: { color: 'success', icon: <DollarOutlined />, label: t('common.paid') }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return <Tag icon={config.icon} color={config.color}>{config.label.toUpperCase()}</Tag>
  }

  const columns: ColumnsType<SalaryRecord> = [
    {
      title: t('common.employee'),
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
      title: t('employees.department'),
      dataIndex: 'department',
      key: 'department',
      width: 130,
      render: (dept) => (
        <Tag icon={<BankOutlined />} color="blue">{dept}</Tag>
      )
    },
    {
      title: t('common.period'),
      key: 'period',
      width: 90,
      align: 'center',
      render: (_, record) => (
        <div className="font-medium">{dayjs().month(record.month - 1).format('MMM')} {record.year}</div>
      )
    },
    {
      title: t('common.baseSalary'),
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      width: 110,
      align: 'right',
      render: (value) => <span className="font-medium">${parseFloat(value).toLocaleString()}</span>
    },
    {
      title: t('common.bonuses'),
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
      title: t('common.overtime'),
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
      title: t('common.deductions'),
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
              <div>{t('common.absence')}: ${absence.toFixed(2)}</div>
              <div>{t('common.latency')}: ${latency.toFixed(2)}</div>
              <div>{t('common.tax')}: ${parseFloat(record.taxDeduction).toFixed(2)}</div>
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
      title: t('common.finalSalary'),
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
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      width: 110,
      align: 'center',
      render: (status) => getStatusTag(status)
    },
    {
      title: t('common.action'),
      key: 'actions',
      fixed: 'right',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Tooltip title={t('common.viewDetails')}>
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
          <CustomSpinner size="large" text={t('common.loading')} />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role={role}>
      <div className="max-w-full">
        {/* Enhanced Header Design */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-8 py-10 relative">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                  backgroundSize: '32px 32px'
                }} />
              </div>

              {/* Content */}
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  {/* Title Section */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                        <DollarOutlined className="text-3xl text-white" />
                      </div>
                      <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
                          {t('navigation.salaryList')}
                        </h1>
                        <p className="text-blue-100 text-base">
                          {t('common.viewAll')} {t('notifications.salary').toLowerCase()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      icon={<PrinterOutlined />}
                      onClick={handlePrint}
                      size="large"
                      className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20 backdrop-blur-sm"
                    >
                      {t('common.print') || 'Print'}
                    </Button>
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={handleExportCSV}
                      size="large"
                      className="!bg-white !border-white !text-blue-600 hover:!bg-blue-50"
                    >
                      {t('common.export') || 'Export CSV'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <Statistic
                title={t('employees.totalEmployees')}
                value={filteredSalaries.length}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff', fontSize: '24px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <Statistic
                title={t('common.totalGross') || 'Total Gross Salary'}
                value={summary.totalGrossSalary}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#52c41a', fontSize: '24px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <Statistic
                title={t('common.totalNet') || 'Total Net Salary'}
                value={summary.totalNetSalary}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#13c2c2', fontSize: '24px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <Statistic
                title={t('common.totalBonuses') || 'Total Bonuses'}
                value={summary.totalBonuses}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#faad14', fontSize: '24px' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="mb-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col md:flex-row gap-4 flex-wrap items-start md:items-center">
            <span className="font-semibold text-gray-700">{t('common.filters') || 'Filters'}:</span>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{t('common.period') || 'Period'}:</span>
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
                <span className="text-sm text-gray-600">{t('employees.department')}:</span>
                <Select
                  value={selectedDepartment}
                  onChange={setSelectedDepartment}
                  style={{ width: 180 }}
                  placeholder={t('departments.allDepartments') || 'All Departments'}
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
              <span className="text-sm text-gray-600">{t('common.status')}:</span>
              <Select
                value={selectedStatus}
                onChange={setSelectedStatus}
                style={{ width: 140 }}
                placeholder={t('common.allStatus') || 'All Status'}
                allowClear
                size="large"
              >
                <Option value="draft">{t('common.draft') || 'Draft'}</Option>
                <Option value="calculated">{t('common.calculated') || 'Calculated'}</Option>
                <Option value="approved">{t('applications.approved')}</Option>
                <Option value="paid">{t('common.paid') || 'Paid'}</Option>
              </Select>
            </div>

            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              size="large"
              className="ml-auto"
            >
              {t('common.refresh')}
            </Button>
          </div>
        </Card>

        {/* Salary Table */}
        <Card className="shadow-sm print-section" id="salary-print-section">
          {filteredSalaries.length === 0 ? (
            <Empty 
              description={t('common.noRecordsFound') || 'No salary records found for the selected period'}
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
                  showTotal: (total) => `${t('common.total')} ${total} ${t('common.employee').toLowerCase()}`,
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
              {t('common.salaryDetails')} - {selectedRecord?.employeeName}
            </div>
          }
          open={detailsModal}
          onCancel={() => setDetailsModal(false)}
          width={800}
          footer={
            <Button type="primary" onClick={() => setDetailsModal(false)}>
              {t('common.close')}
            </Button>
          }
        >
          {selectedRecord && (
            <div>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label={t('common.employeeCode')}>
                  <strong>{selectedRecord.employeeCode}</strong>
                </Descriptions.Item>
                <Descriptions.Item label={t('employees.department')}>
                  <Tag color="blue">{selectedRecord.department}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label={t('common.period')}>
                  {dayjs().month(selectedRecord.month - 1).format('MMMM')} {selectedRecord.year}
                </Descriptions.Item>
                <Descriptions.Item label={t('common.status')}>
                  {getStatusTag(selectedRecord.status)}
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">{t('common.earnings')}</Divider>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label={t('common.baseSalary')}>
                  <span className="font-semibold">${parseFloat(selectedRecord.baseSalary).toLocaleString()}</span>
                </Descriptions.Item>
                <Descriptions.Item label={t('common.bonuses')}>
                  <span className="text-green-600 font-semibold">
                    +${parseFloat(selectedRecord.totalBonuses).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label={t('common.allowances')}>
                  <span className="text-green-600 font-semibold">
                    +${parseFloat(selectedRecord.totalAllowances).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label={t('common.overtimePay')}>
                  <span className="text-blue-600 font-semibold">
                    +${parseFloat(selectedRecord.overtimePay).toLocaleString()}
                  </span>
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">{t('common.deductions')}</Divider>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label={t('common.absenceDeductions')}>
                  <span className="text-red-600 font-semibold">
                    -${parseFloat(selectedRecord.absenceDeductions).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label={t('common.latencyDeductions')}>
                  <span className="text-orange-600 font-semibold">
                    -${parseFloat(selectedRecord.latencyDeductions).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label={t('common.taxDeduction')}>
                  <span className="text-red-600 font-semibold">
                    -${parseFloat(selectedRecord.taxDeduction).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label={t('common.totalDeductions')}>
                  <span className="text-red-600 font-bold text-lg">
                    -${parseFloat(selectedRecord.totalDeductions).toLocaleString()}
                  </span>
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">{t('common.finalAmount')}</Divider>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label={t('common.grossSalary')}>
                  <span className="text-xl font-bold">
                    ${parseFloat(selectedRecord.grossSalary).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label={`${t('common.netSalary')} (${t('common.finalAmount')})`}>
                  <span className="text-2xl font-bold text-emerald-600">
                    ${parseFloat(selectedRecord.netSalary).toLocaleString()}
                  </span>
                </Descriptions.Item>
              </Descriptions>

              {selectedRecord.calculatedAt && (
                <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
                  <p><strong>{t('common.calculated') || 'Calculated'}:</strong> {dayjs(selectedRecord.calculatedAt).format('MMMM D, YYYY h:mm A')}</p>
                  {selectedRecord.approvedAt && (
                    <p><strong>{t('applications.approved')}:</strong> {dayjs(selectedRecord.approvedAt).format('MMMM D, YYYY h:mm A')}</p>
                  )}
                  {selectedRecord.paidAt && (
                    <p><strong>{t('common.paid')}:</strong> {dayjs(selectedRecord.paidAt).format('MMMM D, YYYY h:mm A')}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Professional Print Styles */}
        <style jsx global>{`
          @media print {
            /* Hide everything except the salary table */
            body * {
              visibility: hidden;
            }
            
            #salary-print-section,
            #salary-print-section * {
              visibility: visible;
            }
            
            #salary-print-section {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 40px;
            }

            /* Add professional header with logo */
            #salary-print-section::before {
              content: '';
              display: block;
              width: 150px;
              height: 60px;
              background-image: url('/colored Vertical.png');
              background-size: contain;
              background-repeat: no-repeat;
              background-position: center;
              margin: 0 auto 20px;
            }

            /* Add report title */
            #salary-print-section::after {
              content: '${t('navigation.salaryList')} - ${dayjs().month(selectedMonth - 1).format('MMMM')} ${selectedYear}';
              display: block;
              text-align: center;
              font-size: 24px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 30px;
              padding-bottom: 15px;
              border-bottom: 3px solid #3b82f6;
            }

            /* Table styling */
            .ant-table {
              font-size: 11px !important;
            }

            .ant-table-thead > tr > th {
              background-color: #3b82f6 !important;
              color: white !important;
              font-weight: bold !important;
              padding: 12px 8px !important;
              border: 1px solid #2563eb !important;
            }

            .ant-table-tbody > tr > td {
              padding: 10px 8px !important;
              border: 1px solid #e5e7eb !important;
            }

            .ant-table-tbody > tr:nth-child(even) {
              background-color: #f9fafb !important;
            }

            .ant-table-tbody > tr:hover {
              background-color: #f3f4f6 !important;
            }

            /* Remove action column in print */
            .ant-table-cell:last-child {
              display: none !important;
            }

            .ant-table-thead > tr > th:last-child {
              display: none !important;
            }

            /* Status tags */
            .ant-tag {
              border: 1px solid currentColor !important;
              padding: 2px 8px !important;
            }

            /* Add footer */
            @page {
              margin: 20mm;
              @bottom-center {
                content: '${t('common.appName')} - Page ' counter(page) ' of ' counter(pages);
                font-size: 10px;
                color: #6b7280;
              }
            }

            /* Print page breaks */
            .ant-table-tbody > tr {
              page-break-inside: avoid;
            }

            /* Hide pagination and scrollbars */
            .ant-pagination,
            .ant-table-pagination {
              display: none !important;
            }

            /* Ensure table fits on page */
            .ant-table-wrapper {
              overflow: visible !important;
            }

            .overflow-x-auto {
              overflow: visible !important;
            }

            /* Card styling */
            .ant-card {
              box-shadow: none !important;
              border: none !important;
            }

            .ant-card-body {
              padding: 0 !important;
            }

            /* Summary section at bottom */
            .print-summary {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #3b82f6;
              display: flex;
              justify-content: space-between;
              font-size: 12px;
            }

            .print-summary-item {
              text-align: center;
            }

            .print-summary-label {
              color: #6b7280;
              font-weight: normal;
            }

            .print-summary-value {
              color: #1f2937;
              font-weight: bold;
              font-size: 16px;
              margin-top: 5px;
            }
          }
        `}</style>
      </div>
    </DashboardLayout>
  )
}
