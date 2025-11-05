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
  TeamOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { formatDate, getInitials, formatCurrency } from '@/lib/utils'
import type { ColumnsType } from 'antd/es/table'
import type { MenuProps } from 'antd'
import type { User } from '@/types'
import dayjs from 'dayjs'
import { useRouter, useSearchParams, usePathname, useParams } from 'next/navigation'
import { exportToExcel, exportToPDF, printEmployeeList } from '@/lib/exportUtils'
import { useLocale } from 'next-intl'
import {
  EnhancedTable,
  SearchInput,
  StatCard,
  PageHeader,
  FilterBar,
  FilterSelect,
  EnhancedButton,
  EnhancedModal,
} from '@/components/ui'
import { EmployeesIllustration } from '@/components/ui/illustrations'
import { EmployeeStats } from './EmployeeStats'
import { EmployeeFilters } from './EmployeeFilters'
import { EmployeeTable } from './EmployeeTable'

const { Option } = Select

interface EmployeeListPageProps {
  role: 'admin' | 'manager'
  title: string
  description: string
}

export function EmployeeListPage({ role, title, description }: EmployeeListPageProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const locale = useLocale()
  
  // Initialize from URL params
  const [searchText, setSearchText] = useState(searchParams.get('search') || '')
  const [filters, setFilters] = useState({
    role: role === 'admin' ? searchParams.get('role') || undefined : undefined,
    status: searchParams.get('status') || undefined,
    department: role === 'admin' ? searchParams.get('department') || undefined : undefined,
  })
  const [pagination, setPagination] = useState({ 
    current: parseInt(searchParams.get('page') || '1'),
    pageSize: parseInt(searchParams.get('limit') || '10')
  })

  // Navigate with locale support
  const handleNavigation = (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path
    }
  }

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
    params.set('page', pagination.current.toString())
    params.set('limit', pagination.pageSize.toString())
    
    const newUrl = `${pathname}?${params.toString()}`
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', newUrl)
    }
  }, [searchText, filters, pagination, pathname])

  // Fetch employees based on role
  const { data: usersData, isLoading, refetch } = useQuery({
    queryKey: [
      role === 'admin' ? 'users' : 'manager-employees',
      pagination.current,
      pagination.pageSize,
      searchText,
      filters
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
            department: filters.department
          }
        )
      } else {
        return apiClient.getManagerEmployees({
          page: pagination.current,
          limit: pagination.pageSize,
          search: searchText,
          role: filters.role,
          status: filters.status
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
    setPagination({ current: 1, pageSize: 10 })
    message.success('Filters reset successfully')
  }

  const handleTableChange = (newPagination: any) => {
    setPagination({
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10,
    })
  }

  const basePath = role === 'admin' ? '/admin/employees' : '/manager/employees'

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={title}
        description={description}
        icon={<EmployeesIllustration className="w-20 h-20" />}
        gradient="purple"
        action={
          <div className="flex items-center gap-3">
            <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
              <EnhancedButton variant="secondary" icon={<ExportOutlined />}>
                Export
              </EnhancedButton>
            </Dropdown>
            <EnhancedButton
              variant="primary"
              icon={<PlusOutlined />}
              onClick={() => handleNavigation(`/${locale}${basePath}/add`)}
            >
              Add Employee
            </EnhancedButton>
          </div>
        }
      />

      {/* Stats */}
      <EmployeeStats
        totalEmployees={usersData?.pagination?.total || 0}
        activeCount={usersData?.data?.filter((u: User) => u.active).length || 0}
        inactiveCount={usersData?.data?.filter((u: User) => !u.active).length || 0}
      />

      {/* Search */}
      <SearchInput
        placeholder="Search by name, code, email..."
        value={searchText}
        onChange={(e) => {
          setSearchText(e.target.value)
          setPagination({ ...pagination, current: 1 })
        }}
      />

      {/* Filters */}
      <FilterBar>
        <FilterSelect
          placeholder="Role"
          options={[
            ...(role === 'admin' ? [{ label: 'Admin', value: 'ROLE_ADMIN' }] : []),
            { label: 'Manager', value: 'ROLE_MANAGER' },
            { label: 'Employee', value: 'ROLE_EMPLOYEE' },
          ]}
          value={filters.role}
          onChange={(value) => {
            setFilters({ ...filters, role: value as string })
            setPagination({ ...pagination, current: 1 })
          }}
        />
        
        <FilterSelect
          placeholder="Status"
          options={[
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
          ]}
          value={filters.status}
          onChange={(value) => {
            setFilters({ ...filters, status: value as string })
            setPagination({ ...pagination, current: 1 })
          }}
        />
        
        {role === 'admin' && (
          <FilterSelect
            placeholder="Department"
            options={
              Array.isArray(departmentsData)
                ? departmentsData.map((dept: any) => ({
                    label: dept.departmentName,
                    value: dept.id.toString(),
                  }))
                : []
            }
            value={filters.department}
            onChange={(value) => {
              setFilters({ ...filters, department: value as string })
              setPagination({ ...pagination, current: 1 })
            }}
          />
        )}
        
        <div className="ml-auto flex gap-2">
          <EnhancedButton
            variant="ghost"
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            Refresh
          </EnhancedButton>
          <EnhancedButton
            variant="secondary"
            icon={<ClearOutlined />}
            onClick={handleResetFilters}
          >
            Reset
          </EnhancedButton>
        </div>
      </FilterBar>

      {/* Table */}
      <EmployeeTable
        data={usersData?.data || []}
        loading={isLoading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: usersData?.pagination?.total || 0,
        }}
        onTableChange={handleTableChange}
        onView={(employee) => handleNavigation(`/${locale}${basePath}/${employee.id}`)}
        onEdit={(employee) => handleNavigation(`/${locale}${basePath}/${employee.id}/edit`)}
        onDelete={handleDeleteEmployee}
        role={role}
      />
    </div>
  )
}
