'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message, Modal, Empty, Dropdown, Input } from 'antd'
import {
  PlusOutlined,
  ExportOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  ReloadOutlined,
  ClearOutlined,
  PrinterOutlined,
} from '@ant-design/icons'
import { useSearchParams, usePathname } from 'next/navigation'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import apiClient from '@/lib/api'
import { ApplicationTable, type Application } from './ApplicationTable'
import { ApplicationStats } from './ApplicationStats'
import {
  PageHeader,
  SearchInput,
  FilterBar,
  FilterSelect,
  EnhancedButton,
} from '@/components/ui'
import { ApplicationsIllustration } from '@/components/ui/illustrations/ApplicationsIllustration'
import type { MenuProps } from 'antd'

interface ApplicationListPageProps {
  role: 'admin' | 'manager' | 'employee'
  title: string
  description: string
}

export default function ApplicationListPage({ role, title, description }: ApplicationListPageProps) {
  const locale = useLocale()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [searchText, setSearchText] = useState(searchParams?.get('search') || '')
  const [filters, setFilters] = useState({
    status: searchParams?.get('status') || undefined,
    department: role === 'admin' ? searchParams?.get('department') || undefined : undefined,
    applicationType: searchParams?.get('type') || undefined,
    priority: searchParams?.get('priority') || undefined,
  })
  const [pagination, setPagination] = useState({
    current: parseInt(searchParams?.get('page') || '1'),
    pageSize: parseInt(searchParams?.get('pageSize') || '10'),
  })

  const basePath = 
    role === 'admin' ? '/admin/applications' : 
    role === 'manager' ? '/manager/applications' : 
    '/employee/applications'

  const handleNavigation = (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path
    }
  }

  useEffect(() => {
    const params = new URLSearchParams()
    if (searchText) params.set('search', searchText)
    if (filters.status) params.set('status', filters.status)
    if (filters.department) params.set('department', filters.department)
    if (filters.applicationType) params.set('type', filters.applicationType)
    if (filters.priority) params.set('priority', filters.priority)
    params.set('page', pagination.current.toString())
    params.set('pageSize', pagination.pageSize.toString())

    const newUrl = `${pathname}?${params.toString()}`
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', newUrl)
    }
  }, [searchText, filters, pagination, pathname])

  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiClient.getDepartments(),
    enabled: role === 'admin',
  })

  const { data: applicationsData, isLoading, refetch } = useQuery({
    queryKey: ['applications', role, pagination.current, pagination.pageSize, searchText, filters],
    queryFn: () =>
      apiClient.getApplications(pagination.current, pagination.pageSize, {
        search: searchText,
        status: filters.status,
        department: filters.department,
        applicationType: filters.applicationType,
        priority: filters.priority,
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

  const handleView = (record: Application) => {
    handleNavigation(`/${locale}${basePath}/${record.id}`)
  }

  const handleEdit = (record: Application) => {
    handleNavigation(`/${locale}${basePath}/${record.id}/edit`)
  }

  const handleDelete = (application: Application) => {
    Modal.confirm({
      title: 'Delete Application',
      content: 'Are you sure you want to delete this application?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => deleteApplicationMutation.mutate(application.id),
    })
  }

  const handleApprove = (application: Application) => {
    Modal.confirm({
      title: 'Approve Application',
      content: 'Approve this application?',
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
          <p>Reject this application?</p>
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

  const handleResetFilters = () => {
    setSearchText('')
    setFilters({
      status: undefined,
      department: undefined,
      applicationType: undefined,
      priority: undefined,
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

  const statistics = {
    total: applicationsData?.pagination?.total || 0,
    pending: applicationsData?.data?.filter((app: Application) => app.status === 'pending').length || 0,
    approved: applicationsData?.data?.filter((app: Application) => app.status === 'approved').length || 0,
    rejected: applicationsData?.data?.filter((app: Application) => app.status === 'rejected').length || 0,
  }

  const exportMenuItems: MenuProps['items'] = [
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
      type: 'divider',
    },
    {
      key: 'print',
      icon: <PrinterOutlined />,
      label: 'Print List',
      onClick: handlePrint,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        icon={<ApplicationsIllustration className="w-20 h-20" />}
        gradient="cyan"
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
              Add Application
            </EnhancedButton>
          </div>
        }
      />

      <ApplicationStats
        total={statistics.total}
        pending={statistics.pending}
        approved={statistics.approved}
        rejected={statistics.rejected}
      />

      <SearchInput
        placeholder="Search by title, reason, or applicant name..."
        value={searchText}
        onChange={(e) => {
          setSearchText(e.target.value)
          setPagination({ ...pagination, current: 1 })
        }}
      />

      <FilterBar>
        <FilterSelect
          placeholder="Status"
          options={[
            { label: 'Pending', value: 'pending' },
            { label: 'Approved', value: 'approved' },
            { label: 'Rejected', value: 'rejected' },
          ]}
          value={filters.status}
          onChange={(value) => {
            setFilters({ ...filters, status: value as string })
            setPagination({ ...pagination, current: 1 })
          }}
        />

        <FilterSelect
          placeholder="Application Type"
          options={[
            { label: 'Leave', value: 'leave' },
            { label: 'Overtime', value: 'overtime' },
            { label: 'Remote Work', value: 'remote' },
            { label: 'Other', value: 'other' },
          ]}
          value={filters.applicationType}
          onChange={(value) => {
            setFilters({ ...filters, applicationType: value as string })
            setPagination({ ...pagination, current: 1 })
          }}
        />

        <FilterSelect
          placeholder="Priority"
          options={[
            { label: 'Low', value: 'low' },
            { label: 'Medium', value: 'medium' },
            { label: 'High', value: 'high' },
            { label: 'Urgent', value: 'urgent' },
          ]}
          value={filters.priority}
          onChange={(value) => {
            setFilters({ ...filters, priority: value as string })
            setPagination({ ...pagination, current: 1 })
          }}
        />

        {role === 'admin' && (
          <FilterSelect
            placeholder="Department"
            options={
              Array.isArray(departmentsData)
                ? departmentsData.map((dept: any) => ({
                    label: dept.departmentName || dept.name,
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

      {applicationsData?.data?.length === 0 && !isLoading ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No applications found"
          className="my-8"
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
          onPaginationChange={(page, pageSize) => setPagination({ current: page, pageSize })}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onApprove={handleApprove}
          onReject={handleReject}
          role={role}
        />
      )}
    </div>
  )
}
