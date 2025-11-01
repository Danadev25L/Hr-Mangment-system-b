'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  message,
  Modal,
  Tag,
  Card,
  Dropdown,
  Menu,
  Row,
  Col,
  Statistic,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  PrinterOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  MoreOutlined,
  ReloadOutlined,
  FileTextOutlined,
  FlagOutlined,
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import apiClient from '@/lib/api'

const { RangePicker } = DatePicker

interface ApplicationListPageProps {
  role: 'admin' | 'manager'
  title?: string
  description?: string
}

interface Application {
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

export default function ApplicationListPage({ role, title, description }: ApplicationListPageProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Set default title and description if not provided
  const pageTitle = title || (role === 'admin' ? 'Application Management' : 'Department Applications')
  const pageDescription = description || (role === 'admin' 
    ? 'Manage all applications across the organization' 
    : 'Manage applications for your department')
  
  const [searchText, setSearchText] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    department: 'all',
    applicationType: 'all',
    priority: 'all',
  })
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  })

  // Base path for routing
  const basePath = role === 'admin' ? '/admin/applications' : '/manager/applications'

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

  const handleDeleteApplication = (application: Application) => {
    Modal.confirm({
      title: 'Delete Application',
      content: `Are you sure you want to delete this application: ${application.title}?`,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: () => deleteApplicationMutation.mutate(application.id),
    })
  }

  const handleApprove = (application: Application) => {
    Modal.confirm({
      title: 'Approve Application',
      content: `Approve application &ldquo;${application.title}&rdquo;?`,
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
          <p>Reject application &ldquo;{application.title}&rdquo;?</p>
          <Input.TextArea
            placeholder="Reason for rejection (optional)"
            rows={3}
            onChange={(e) => (rejectionReason = e.target.value)}
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

  const getStatusTag = (status: string) => {
    const statusConfig = {
      pending: { color: 'warning', icon: <ClockCircleOutlined /> },
      approved: { color: 'success', icon: <CheckCircleOutlined /> },
      rejected: { color: 'error', icon: <CloseCircleOutlined /> },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return (
      <Tag color={config.color} icon={config.icon}>
        {status.toUpperCase()}
      </Tag>
    )
  }

  const getPriorityTag = (priority: string) => {
    const priorityConfig = {
      low: { color: 'default' },
      medium: { color: 'processing' },
      high: { color: 'warning' },
      urgent: { color: 'error' },
    }
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low
    return (
      <Tag color={config.color} icon={<FlagOutlined />}>
        {priority.toUpperCase()}
      </Tag>
    )
  }

  const columns = [
    {
      title: 'Submitted By',
      dataIndex: 'userName',
      key: 'userName',
      width: 150,
    },
    ...(role === 'admin'
      ? [
          {
            title: 'Department',
            dataIndex: 'departmentName',
            key: 'departmentName',
            width: 150,
            render: (text: string) => text || 'N/A',
          },
        ]
      : []),
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: 'Type',
      dataIndex: 'applicationType',
      key: 'applicationType',
      width: 120,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => getPriorityTag(priority),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: Application) => {
        const menu = (
          <Menu>
            <Menu.Item
              key="view"
              icon={<EyeOutlined />}
              onClick={() => router.push(`${basePath}/${record.id}`)}
            >
              View Details
            </Menu.Item>
            <Menu.Item
              key="edit"
              icon={<EditOutlined />}
              onClick={() => router.push(`${basePath}/${record.id}/edit`)}
            >
              Edit
            </Menu.Item>
            {record.status === 'pending' && (
              <>
                <Menu.Divider />
                <Menu.Item
                  key="approve"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleApprove(record)}
                >
                  Approve
                </Menu.Item>
                <Menu.Item
                  key="reject"
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleReject(record)}
                >
                  Reject
                </Menu.Item>
              </>
            )}
            <Menu.Divider />
            <Menu.Item
              key="delete"
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDeleteApplication(record)}
            >
              Delete
            </Menu.Item>
          </Menu>
        )

        return (
          <Dropdown overlay={menu} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        )
      },
    },
  ]

  // Calculate statistics
  const statistics = {
    total: applicationsData?.pagination?.total || 0,
    pending: applicationsData?.data?.filter((app: Application) => app.status === 'pending').length || 0,
    approved: applicationsData?.data?.filter((app: Application) => app.status === 'approved').length || 0,
    rejected: applicationsData?.data?.filter((app: Application) => app.status === 'rejected').length || 0,
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{pageTitle}</h1>
        <p className="text-gray-600 mt-1">{pageDescription}</p>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Applications"
              value={statistics.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending"
              value={statistics.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Approved"
              value={statistics.approved}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Rejected"
              value={statistics.rejected}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* Search and Action Buttons */}
          <div className="flex justify-between items-center">
            <Input
              placeholder="Search by title, reason, or applicant name..."
              prefix={<SearchOutlined />}
              style={{ width: 400 }}
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
            />
            <Space>
              <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
                Refresh
              </Button>
              <Dropdown
                overlay={
                  <Menu>
                    <Menu.Item key="excel" icon={<FileExcelOutlined />} onClick={exportToExcel}>
                      Export to Excel
                    </Menu.Item>
                    <Menu.Item key="pdf" icon={<FilePdfOutlined />} onClick={exportToPDF}>
                      Export to PDF
                    </Menu.Item>
                    <Menu.Item key="print" icon={<PrinterOutlined />} onClick={handlePrint}>
                      Print
                    </Menu.Item>
                  </Menu>
                }
              >
                <Button icon={<ExportOutlined />}>Export</Button>
              </Dropdown>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push(`${basePath}/add`)}
              >
                Add Application
              </Button>
            </Space>
          </div>

          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <Select
              placeholder="Filter by Status"
              style={{ width: 180 }}
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
            >
              <Select.Option value="all">All Status</Select.Option>
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="approved">Approved</Select.Option>
              <Select.Option value="rejected">Rejected</Select.Option>
            </Select>

            <Select
              placeholder="Filter by Type"
              style={{ width: 180 }}
              value={filters.applicationType}
              onChange={(value) => handleFilterChange('applicationType', value)}
            >
              <Select.Option value="all">All Types</Select.Option>
              <Select.Option value="leave">Leave</Select.Option>
              <Select.Option value="overtime">Overtime</Select.Option>
              <Select.Option value="remote">Remote Work</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>

            <Select
              placeholder="Filter by Priority"
              style={{ width: 180 }}
              value={filters.priority}
              onChange={(value) => handleFilterChange('priority', value)}
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
                style={{ width: 200 }}
                value={filters.department}
                onChange={(value) => handleFilterChange('department', value)}
                loading={!departmentsData}
              >
                <Select.Option value="all">All Departments</Select.Option>
                {(Array.isArray(departmentsData) ? departmentsData : departmentsData?.data || [])?.map((dept: any) => (
                  <Select.Option key={dept.id} value={dept.id}>
                    {dept.departmentName || dept.name}
                  </Select.Option>
                ))}
              </Select>
            )}

            <RangePicker
              style={{ width: 280 }}
              value={dateRange}
              onChange={handleDateRangeChange}
              format="YYYY-MM-DD"
            />
          </div>
        </Space>
      </Card>

      {/* Applications Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={applicationsData?.data || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: applicationsData?.pagination?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} applications`,
            onChange: (page, pageSize) => {
              setPagination({ current: page, pageSize: pageSize || 10 })
            },
          }}
        />
      </Card>
    </div>
  )
}
