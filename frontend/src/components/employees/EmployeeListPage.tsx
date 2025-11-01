'use client'

import React, { useState, useEffect } from 'react'
import {
  Table,
  Card,
  Button,
  Input,
  Space,
  Tag,
  Avatar,
  Dropdown,
  Modal,
  message,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Tooltip,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  MoreOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ExportOutlined,
  PrinterOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  ReloadOutlined,
  ClearOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { formatDate, getInitials, formatCurrency } from '@/lib/utils'
import type { ColumnsType } from 'antd/es/table'
import type { MenuProps } from 'antd'
import type { User } from '@/types'
import dayjs from 'dayjs'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { exportToExcel, exportToPDF, printEmployeeList } from '@/lib/exportUtils'

const { Option } = Select
const { RangePicker } = DatePicker

interface EmployeeListPageProps {
  role: 'admin' | 'manager'
  title: string
  description: string
}

export function EmployeeListPage({ role, title, description }: EmployeeListPageProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  
  // Initialize from URL params
  const [searchText, setSearchText] = useState(searchParams.get('search') || '')
  const [filters, setFilters] = useState({
    role: role === 'admin' ? searchParams.get('role') || undefined : undefined,
    status: searchParams.get('status') || undefined,
    department: role === 'admin' ? searchParams.get('department') || undefined : undefined,
  })
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    searchParams.get('startDate') && searchParams.get('endDate')
      ? [dayjs(searchParams.get('startDate')), dayjs(searchParams.get('endDate'))]
      : null
  )
  const [pagination, setPagination] = useState({ 
    current: parseInt(searchParams.get('page') || '1'),
    pageSize: parseInt(searchParams.get('limit') || '10')
  })

  // Fetch departments for admin
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiClient.getDepartments(),
    enabled: role === 'admin',
  })

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchText) params.set('search', searchText)
    if (filters.role) params.set('role', filters.role)
    if (filters.status) params.set('status', filters.status)
    if (filters.department) params.set('department', filters.department)
    if (dateRange?.[0]) params.set('startDate', dateRange[0].toISOString())
    if (dateRange?.[1]) params.set('endDate', dateRange[1].toISOString())
    params.set('page', pagination.current.toString())
    params.set('limit', pagination.pageSize.toString())
    
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchText, filters, dateRange, pagination, pathname, router])

  // Fetch employees based on role
  const { data: usersData, isLoading, refetch } = useQuery({
    queryKey: [
      role === 'admin' ? 'users' : 'manager-employees',
      pagination.current,
      pagination.pageSize,
      searchText,
      filters,
      dateRange
    ],
    queryFn: () => {
      if (role === 'admin') {
        return apiClient.getUsers(
          pagination.current,
          pagination.pageSize,
          {
            search: searchText,
            role: filters.role,
            status: filters.status,
            department: filters.department,
            startDate: dateRange?.[0]?.toISOString(),
            endDate: dateRange?.[1]?.toISOString(),
          }
        )
      } else {
        return apiClient.getManagerEmployees({
          page: pagination.current,
          limit: pagination.pageSize,
          search: searchText,
          role: filters.role,
          status: filters.status,
          startDate: dateRange?.[0]?.toISOString(),
          endDate: dateRange?.[1]?.toISOString(),
        })
      }
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => apiClient.deleteUser(userId),
    onSuccess: () => {
      message.success('Employee deleted successfully')
      queryClient.invalidateQueries({ queryKey: [role === 'admin' ? 'users' : 'manager-employees'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to delete employee')
    },
  })

  const handleDeleteEmployee = (employee: User) => {
    Modal.confirm({
      title: 'Delete Employee',
      content: `Are you sure you want to delete ${employee.fullName}? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => deleteUserMutation.mutate(employee.id),
    })
  }

  // Export handlers
  const handleExportExcel = () => {
    const allUsers = usersData?.data || []
    const success = exportToExcel(
      allUsers,
      role === 'admin' ? 'all_employees' : 'department_employees'
    )
    if (success) {
      message.success('Employees exported to Excel successfully')
    } else {
      message.error('Failed to export to Excel')
    }
  }

  const handleExportPDF = () => {
    const allUsers = usersData?.data || []
    const success = exportToPDF(
      allUsers,
      role === 'admin' ? 'all_employees' : 'department_employees',
      role === 'admin' ? 'All Employees List' : 'Department Employees List'
    )
    if (success) {
      message.success('Employees exported to PDF successfully')
    } else {
      message.error('Failed to export to PDF')
    }
  }

  const handlePrint = () => {
    const allUsers = usersData?.data || []
    const success = printEmployeeList(
      allUsers,
      role === 'admin' ? 'All Employees List' : 'Department Employees List'
    )
    if (success) {
      message.success('Print dialog opened')
    } else {
      message.error('Failed to open print dialog')
    }
  }

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'excel',
      icon: <FileExcelOutlined />,
      label: 'Export to Excel',
      onClick: handleExportExcel,
    },
    {
      key: 'pdf',
      icon: <FilePdfOutlined />,
      label: 'Export to PDF',
      onClick: handleExportPDF,
    },
    {
      type: 'divider',
    },
    {
      key: 'print',
      icon: <PrinterOutlined />,
      label: 'Print List',
      onClick: handlePrint,
    },
  ]

  const handleResetFilters = () => {
    setSearchText('')
    setFilters({
      role: undefined,
      status: undefined,
      department: undefined,
    })
    setDateRange(null)
    setPagination({ current: 1, pageSize: 10 })
    message.success('Filters reset successfully')
  }

  const handleTableChange = (newPagination: any) => {
    setPagination({
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10,
    })
  }

  const columns: ColumnsType<User> = [
    {
      title: 'Employee',
      key: 'user',
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <Avatar
            src={record.avatar}
            icon={<UserOutlined />}
            className="bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300"
          >
            {getInitials(record.fullName)}
          </Avatar>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{record.fullName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">@{record.username}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Code: {record.employeeCode}</p>
          </div>
        </div>
      ),
    },
    ...(role === 'admin' ? [{
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (roleValue: string) => (
        <Tag color={roleValue === 'ROLE_ADMIN' ? 'red' : roleValue === 'ROLE_MANAGER' ? 'blue' : 'green'}>
          {roleValue.replace('ROLE_', '')}
        </Tag>
      ),
    }] : []),
    {
      title: 'Job Title',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      render: (jobTitle) => jobTitle || '-',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (dept) => {
        if (typeof dept === 'object' && dept?.departmentName) {
          return dept.departmentName
        }
        return dept || '-'
      },
    },
    {
      title: 'Base Salary',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      render: (salary) => salary !== undefined && salary !== null ? formatCurrency(salary) : '-',
      sorter: (a, b) => (a.baseSalary || 0) - (b.baseSalary || 0),
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const basePath = role === 'admin' ? '/admin/employees' : '/manager/employees'
        const items: MenuProps['items'] = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: 'View Details',
            onClick: () => router.push(`${basePath}/${record.id}`),
          },
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit',
            onClick: () => router.push(`${basePath}/${record.id}/edit`),
          },
          {
            type: 'divider',
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete',
            danger: true,
            onClick: () => handleDeleteEmployee(record),
          },
        ]

        return (
          <Space size="small">
            <Tooltip title="View Details">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => router.push(`${basePath}/${record.id}`)}
                size="small"
              />
            </Tooltip>
            <Tooltip title="Edit">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => router.push(`${basePath}/${record.id}/edit`)}
                size="small"
              />
            </Tooltip>
            <Dropdown menu={{ items }} trigger={['click']}>
              <Button type="text" icon={<MoreOutlined />} size="small" />
            </Dropdown>
          </Space>
        )
      },
    },
  ]

  const basePath = role === 'admin' ? '/admin/employees' : '/manager/employees'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
            <Button icon={<ExportOutlined />}>Export</Button>
          </Dropdown>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push(`${basePath}/add`)}
          >
            Add Employee
          </Button>
        </div>
      </div>

      {/* Stats */}
      <Row gutter={16}>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Total Employees"
              value={usersData?.pagination?.total || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Active"
              value={usersData?.data?.filter((u: User) => u.active).length || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Inactive"
              value={usersData?.data?.filter((u: User) => !u.active).length || 0}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card 
        title={
          <Space>
            <FilterOutlined />
            <span>Filters & Search</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
              Refresh
            </Button>
            <Button icon={<ClearOutlined />} onClick={handleResetFilters}>
              Reset
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search by name, code, email..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value)
                setPagination({ ...pagination, current: 1 })
              }}
              allowClear
              size="large"
            />
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Role"
              style={{ width: '100%' }}
              value={filters.role}
              onChange={(value) => {
                setFilters({ ...filters, role: value })
                setPagination({ ...pagination, current: 1 })
              }}
              allowClear
              size="large"
            >
              {role === 'admin' && <Option value="ROLE_ADMIN">Admin</Option>}
              <Option value="ROLE_MANAGER">Manager</Option>
              <Option value="ROLE_EMPLOYEE">Employee</Option>
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Status"
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(value) => {
                setFilters({ ...filters, status: value })
                setPagination({ ...pagination, current: 1 })
              }}
              allowClear
              size="large"
            >
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Col>
          
          {role === 'admin' && (
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Department"
                style={{ width: '100%' }}
                value={filters.department}
                onChange={(value) => {
                  setFilters({ ...filters, department: value })
                  setPagination({ ...pagination, current: 1 })
                }}
                allowClear
                size="large"
              >
                {Array.isArray(departmentsData) && departmentsData.map((dept: any) => (
                  <Option key={dept.id} value={dept.id.toString()}>
                    {dept.departmentName}
                  </Option>
                ))}
              </Select>
            </Col>
          )}
          
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={(dates) => {
                setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
                setPagination({ ...pagination, current: 1 })
              }}
              size="large"
              placeholder={['Start Date', 'End Date']}
            />
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={usersData?.data || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: usersData?.pagination?.total || 0,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} employees`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  )
}
