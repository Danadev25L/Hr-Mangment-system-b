'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  message,
  Modal,
  Card,
  Dropdown,
  Breadcrumb,
  Empty,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  ExportOutlined,
  PrinterOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  ReloadOutlined,
  HomeOutlined,
  FilterOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useRouter, useSearchParams } from 'next/navigation'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import apiClient from '@/lib/api'
import { ApplicationTable, type Application } from './ApplicationTable'
import { ApplicationStats } from './ApplicationStats'

const { RangePicker } = DatePicker

interface ApplicationListPageProps {
  role: 'admin' | 'manager'
  title?: string
  description?: string
}

export default function ApplicationListPage({ role, title, description }: ApplicationListPageProps) {
  const t = useTranslations()
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()

  // Set default title and description if not provided
  const pageTitle = title || (role === 'admin' ? t('applications.allApplications') : t('applications.teamApplications'))
  const pageDescription = description || (role === 'admin' 
    ? t('applications.subtitle') 
    : t('applications.subtitleManager'))

  // State with URL sync
  const [searchText, setSearchText] = useState(searchParams?.get('search') || '')
  const [filters, setFilters] = useState({
    status: searchParams?.get('status') || 'all',
    department: searchParams?.get('department') || 'all',
    applicationType: searchParams?.get('type') || 'all',
    priority: searchParams?.get('priority') || 'all',
  })
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [pagination, setPagination] = useState({
    current: parseInt(searchParams?.get('page') || '1'),
    pageSize: parseInt(searchParams?.get('pageSize') || '10'),
  })

  // Base path for routing
  const basePath = role === 'admin' ? '/admin/applications' : '/manager/applications'
  const dashboardPath = role === 'admin' ? '/admin/dashboard' : '/manager/dashboard'

  // Sync URL with state
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchText) params.set('search', searchText)
    if (filters.status !== 'all') params.set('status', filters.status)
    if (filters.department !== 'all') params.set('department', filters.department)
    if (filters.applicationType !== 'all') params.set('type', filters.applicationType)
    if (filters.priority !== 'all') params.set('priority', filters.priority)
    if (pagination.current !== 1) params.set('page', pagination.current.toString())
    if (pagination.pageSize !== 10) params.set('pageSize', pagination.pageSize.toString())

    const newUrl = params.toString() ? `${basePath}?${params.toString()}` : basePath
    window.history.replaceState({}, '', newUrl)
  }, [searchText, filters, pagination, basePath])

  // Fetch departments for admin
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiClient.getDepartments(),
    enabled: role === 'admin',
  })

  // Fetch applications
  const { data: applicationsData, isLoading, refetch } = useQuery({
    queryKey: ['applications', role, pagination.current, pagination.pageSize, searchText, filters, dateRange],
    queryFn: () =>
      apiClient.getApplications(pagination.current, pagination.pageSize, {
        search: searchText,
        status: filters.status !== 'all' ? filters.status : undefined,
        department: filters.department !== 'all' ? filters.department : undefined,
        applicationType: filters.applicationType !== 'all' ? filters.applicationType : undefined,
        priority: filters.priority !== 'all' ? filters.priority : undefined,
        startDate: dateRange?.[0]?.toISOString(),
        endDate: dateRange?.[1]?.toISOString(),
      }),
  })

  const deleteApplicationMutation = useMutation({
    mutationFn: (applicationId: number) => apiClient.deleteApplication(applicationId.toString()),
    onSuccess: () => {
      message.success('Application deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to delete application')
    },
  })

  const approveApplicationMutation = useMutation({
    mutationFn: (applicationId: number) => apiClient.approveApplication(applicationId.toString()),
    onSuccess: () => {
      message.success('Application approved successfully')
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to approve application')
    },
  })

  const rejectApplicationMutation = useMutation({
    mutationFn: ({ applicationId, rejectionReason }: { applicationId: number; rejectionReason?: string }) =>
      apiClient.rejectApplication(applicationId.toString(), rejectionReason),
    onSuccess: () => {
      message.success('Application rejected successfully')
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to reject application')
    },
  })

  const handleSearch = (value: string) => {
    setSearchText(value)
    setPagination({ ...pagination, current: 1 })
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value })
    setPagination({ ...pagination, current: 1 })
  }

  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates)
    setPagination({ ...pagination, current: 1 })
  }

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination({ current: page, pageSize })
  }

  const handleView = (record: Application) => {
    router.push(`${basePath}/${record.id}`)
  }

  const handleEdit = (record: Application) => {
    router.push(`${basePath}/${record.id}/edit`)
  }

  const handleDelete = (application: Application) => {
    Modal.confirm({
      title: 'Delete Application',
      content: `Are you sure you want to delete "${application.title}"?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => deleteApplicationMutation.mutate(application.id),
    })
  }

  const handleApprove = (application: Application) => {
    Modal.confirm({
      title: 'Approve Application',
      content: `Approve application "${application.title}"?`,
      okText: 'Approve',
      okType: 'primary',
      cancelText: 'Cancel',
      onOk: () => approveApplicationMutation.mutate(application.id),
    })
  }

  const handleReject = (application: Application) => {
    let rejectionReason = ''
    Modal.confirm({
      title: 'Reject Application',
      content: (
        <div>
          <p>Reject application "{application.title}"?</p>
          <Input.TextArea
            placeholder="Reason for rejection (optional)"
            rows={3}
            onChange={(e) => (rejectionReason = e.target.value)}
            className="mt-2"
          />
        </div>
      ),
      okText: 'Reject',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => rejectApplicationMutation.mutate({ applicationId: application.id, rejectionReason }),
    })
  }

  const exportToExcel = () => {
    const data = applicationsData?.data || []
    const worksheet = XLSX.utils.json_to_sheet(
      data.map((application: Application) => ({
        'Submitted By': application.userName,
        Department: application.departmentName || 'N/A',
        Title: application.title,
        Type: application.applicationType,
        Priority: application.priority,
        Status: application.status,
        'Start Date': dayjs(application.startDate).format('YYYY-MM-DD'),
        'End Date': dayjs(application.endDate).format('YYYY-MM-DD'),
        Reason: application.reason,
        'Created At': dayjs(application.createdAt).format('YYYY-MM-DD HH:mm'),
      }))
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications')
    XLSX.writeFile(workbook, `applications_${dayjs().format('YYYY-MM-DD')}.xlsx`)
    message.success('Applications exported to Excel successfully')
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    const data = applicationsData?.data || []

    doc.setFontSize(18)
    doc.text('Application Report', 14, 22)
    doc.setFontSize(11)
    doc.text(`Generated: ${dayjs().format('YYYY-MM-DD HH:mm')}`, 14, 30)

    const tableData = data.map((application: Application) => [
      application.userName,
      application.departmentName || 'N/A',
      application.title,
      application.applicationType,
      application.priority,
      application.status,
      dayjs(application.startDate).format('YYYY-MM-DD'),
    ])

    ;(doc as any).autoTable({
      head: [['Submitted By', 'Department', 'Title', 'Type', 'Priority', 'Status', 'Start Date']],
      body: tableData,
      startY: 35,
    })

    doc.save(`applications_${dayjs().format('YYYY-MM-DD')}.pdf`)
    message.success('Applications exported to PDF successfully')
  }

  const handlePrint = () => {
    window.print()
    message.success('Print dialog opened')
  }

  const handleClearFilters = () => {
    setSearchText('')
    setFilters({
      status: 'all',
      department: 'all',
      applicationType: 'all',
      priority: 'all',
    })
    setDateRange(null)
    setPagination({ current: 1, pageSize: 10 })
  }

  // Calculate statistics
  const statistics = {
    total: applicationsData?.pagination?.total || 0,
    pending: applicationsData?.data?.filter((app: Application) => app.status === 'pending').length || 0,
    approved: applicationsData?.data?.filter((app: Application) => app.status === 'approved').length || 0,
    rejected: applicationsData?.data?.filter((app: Application) => app.status === 'rejected').length || 0,
  }

  const hasActiveFilters = searchText || filters.status !== 'all' || filters.department !== 'all' || 
    filters.applicationType !== 'all' || filters.priority !== 'all' || dateRange

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          {
            title: (
              <span className="flex items-center cursor-pointer hover:text-blue-600 transition-colors" onClick={() => router.push(dashboardPath)}>
                <HomeOutlined className="mr-1" />
                Dashboard
              </span>
            ),
          },
          {
            title: (
              <span className="flex items-center">
                <FileTextOutlined className="mr-1" />
                Applications
              </span>
            ),
          },
        ]}
      />

      {/* Header */}
      <Card className="shadow-lg border-t-4 border-t-purple-500">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileTextOutlined className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 m-0">{pageTitle}</h1>
              <p className="text-gray-600 dark:text-gray-400 m-0">{pageDescription}</p>
            </div>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => router.push(`${basePath}/add`)}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 border-none hover:from-purple-600 hover:to-indigo-700 shadow-md"
          >
            Add Application
          </Button>
        </div>
      </Card>

      {/* Statistics */}
      <ApplicationStats
        total={statistics.total}
        pending={statistics.pending}
        approved={statistics.approved}
        rejected={statistics.rejected}
      />

      {/* Filters */}
      <Card className="shadow-md">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search by title, reason, or applicant name..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
              size="large"
              className="flex-1"
            />
            <Space wrap>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
                size="large"
              >
                Refresh
              </Button>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'excel',
                      icon: <FileExcelOutlined />,
                      label: 'Export to Excel',
                      onClick: exportToExcel,
                    },
                    {
                      key: 'pdf',
                      icon: <FilePdfOutlined />,
                      label: 'Export to PDF',
                      onClick: exportToPDF,
                    },
                    {
                      key: 'print',
                      icon: <PrinterOutlined />,
                      label: 'Print',
                      onClick: handlePrint,
                    },
                  ],
                }}
              >
                <Button icon={<ExportOutlined />} size="large">
                  Export
                </Button>
              </Dropdown>
            </Space>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-3">
            <Select
              placeholder="Filter by Status"
              style={{ minWidth: 180 }}
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              size="large"
            >
              <Select.Option value="all">All Status</Select.Option>
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="approved">Approved</Select.Option>
              <Select.Option value="rejected">Rejected</Select.Option>
            </Select>

            <Select
              placeholder="Filter by Type"
              style={{ minWidth: 180 }}
              value={filters.applicationType}
              onChange={(value) => handleFilterChange('applicationType', value)}
              size="large"
            >
              <Select.Option value="all">All Types</Select.Option>
              <Select.Option value="leave">Leave</Select.Option>
              <Select.Option value="overtime">Overtime</Select.Option>
              <Select.Option value="remote">Remote Work</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>

            <Select
              placeholder="Filter by Priority"
              style={{ minWidth: 180 }}
              value={filters.priority}
              onChange={(value) => handleFilterChange('priority', value)}
              size="large"
            >
              <Select.Option value="all">All Priorities</Select.Option>
              <Select.Option value="low">Low</Select.Option>
              <Select.Option value="medium">Medium</Select.Option>
              <Select.Option value="high">High</Select.Option>
              <Select.Option value="urgent">Urgent</Select.Option>
            </Select>

            {role === 'admin' && (
              <Select
                placeholder="Filter by Department"
                style={{ minWidth: 200 }}
                value={filters.department}
                onChange={(value) => handleFilterChange('department', value)}
                loading={!departmentsData}
                size="large"
              >
                <Select.Option value="all">All Departments</Select.Option>
                {(Array.isArray(departmentsData) ? departmentsData : (departmentsData as any)?.data || [])?.map((dept: any) => (
                  <Select.Option key={dept.id} value={dept.id}>
                    {dept.departmentName || dept.name}
                  </Select.Option>
                ))}
              </Select>
            )}

            <RangePicker
              style={{ minWidth: 280 }}
              value={dateRange}
              onChange={handleDateRangeChange}
              format="YYYY-MM-DD"
              size="large"
            />

            {hasActiveFilters && (
              <Button
                icon={<FilterOutlined />}
                onClick={handleClearFilters}
                size="large"
                danger
              >
                Clear Filters
              </Button>
            )}
          </div>
        </Space>
      </Card>

      {/* Applications Table */}
      <Card className="shadow-md">
        {applicationsData?.data?.length === 0 && !isLoading ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No applications found"
          />
        ) : (
          <ApplicationTable
            data={applicationsData?.data || []}
            loading={isLoading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: applicationsData?.pagination?.total || 0,
            }}
            onPaginationChange={handlePaginationChange}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onApprove={handleApprove}
            onReject={handleReject}
            role={role}
          />
        )}
      </Card>
    </div>
  )
}
