'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Modal,
  Descriptions,
  Divider,
  message,
  Tag,
  Dropdown,
  Button,
  type MenuProps,
} from 'antd'
import {
  DollarOutlined,
  PrinterOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  ClockCircleOutlined,
  CalculatorOutlined,
  CheckOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import apiClient from '@/lib/api'
import { useTranslations, useLocale } from 'next-intl'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { 
  PageHeader, 
  SearchInput,
  EnhancedButton,
  CustomSpinner 
} from '@/components/ui'
import { SalaryIllustration } from '@/components/ui/illustrations'
import { SalaryStats } from './SalaryStats'
import { SalaryFilters } from './SalaryFilters'
import { SalaryTable } from './SalaryTable'

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
  title: string
  description: string
}

export default function SalaryListPage({ role, title, description }: SalaryListProps) {
  const t = useTranslations()
  const locale = useLocale()
  const currentDate = dayjs()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.month() + 1)
  const [selectedYear, setSelectedYear] = useState(currentDate.year())
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [detailsModal, setDetailsModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<SalaryRecord | null>(null)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 })

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

  const handleTableChange = (newPagination: any) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    })
  }

  const handleFilterChange = (key: string, value: any) => {
    if (key === 'month') setSelectedMonth(value)
    else if (key === 'year') setSelectedYear(value)
    else if (key === 'status') setSelectedStatus(value)
    else if (key === 'department') setSelectedDepartment(value)
  }

  const handleReset = () => {
    setSelectedMonth(currentDate.month() + 1)
    setSelectedYear(currentDate.year())
    setSelectedStatus('')
    setSelectedDepartment('')
    setPagination({ current: 1, pageSize: 20 })
  }

  const handleNavigation = (path: string) => {
    window.location.href = path
  }

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'excel',
      icon: <FileExcelOutlined />,
      label: 'Export Excel',
      onClick: handleExportCSV,
    },
    {
      key: 'pdf',
      icon: <FilePdfOutlined />,
      label: 'Export PDF',
    },
    {
      key: 'print',
      icon: <PrinterOutlined />,
      label: 'Print',
      onClick: handlePrint,
    },
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

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title={title}
          description={description}
          icon={<SalaryIllustration />}
          gradient="green"
          action={
            <div className="flex gap-3">
              <EnhancedButton
                onClick={() => handleNavigation(`/${locale}/admin/salary/adjustments`)}
                icon={<DollarOutlined />}
              >
                Adjust Salary
              </EnhancedButton>
              <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
                <EnhancedButton variant="secondary" icon={<DownloadOutlined />}>
                  Export
                </EnhancedButton>
              </Dropdown>
            </div>
          }
        />

      {/* Salary Stats */}
      <SalaryStats
        totalEmployees={filteredSalaries.length}
        totalGrossSalary={summary.totalGrossSalary}
        totalNetSalary={summary.totalNetSalary}
        totalBonuses={summary.totalBonuses}
      />

      {/* Filters */}
      <SalaryFilters
        role={isAdmin ? 'admin' : 'manager'}
        filters={{
          month: selectedMonth,
          year: selectedYear,
          status: selectedStatus,
          department: selectedDepartment,
        }}
        departments={departments}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        onRefresh={() => refetch()}
        isLoading={isLoading}
      />

      {/* Salary Table */}
      <SalaryTable
        data={filteredSalaries}
        loading={isLoading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: filteredSalaries.length,
        }}
        onTableChange={handleTableChange}
        onViewDetails={handleViewDetails}
      />

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
                  <span className="font-semibold">${Math.max(0, parseFloat(selectedRecord.baseSalary) || 0).toLocaleString()}</span>
                </Descriptions.Item>
                <Descriptions.Item label={t('common.bonuses')}>
                  <span className="text-green-600 font-semibold">
                    +${Math.max(0, parseFloat(selectedRecord.totalBonuses) || 0).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label={t('common.allowances')}>
                  <span className="text-green-600 font-semibold">
                    +${Math.max(0, parseFloat(selectedRecord.totalAllowances) || 0).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label={t('common.overtimePay')}>
                  <span className="text-blue-600 font-semibold">
                    +${Math.max(0, parseFloat(selectedRecord.overtimePay) || 0).toLocaleString()}
                  </span>
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">{t('common.deductions')}</Divider>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label={t('common.absenceDeductions')}>
                  <span className="text-red-600 font-semibold">
                    -${Math.max(0, parseFloat(selectedRecord.absenceDeductions) || 0).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label={t('common.latencyDeductions')}>
                  <span className="text-orange-600 font-semibold">
                    -${Math.max(0, parseFloat(selectedRecord.latencyDeductions) || 0).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label={t('common.taxDeduction')}>
                  <span className="text-red-600 font-semibold">
                    -${Math.max(0, parseFloat(selectedRecord.taxDeduction) || 0).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label={t('common.totalDeductions')}>
                  <span className="text-red-600 font-bold text-lg">
                    -${Math.max(0, parseFloat(selectedRecord.totalDeductions) || 0).toLocaleString()}
                  </span>
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">{t('common.finalAmount')}</Divider>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label={t('common.grossSalary')}>
                  <span className="text-xl font-bold">
                    ${Math.max(0, parseFloat(selectedRecord.grossSalary) || 0).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label={`${t('common.netSalary')} (${t('common.finalAmount')})`}>
                  <span className="text-2xl font-bold text-emerald-600">
                    ${Math.max(0, parseFloat(selectedRecord.netSalary) || 0).toLocaleString()}
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
