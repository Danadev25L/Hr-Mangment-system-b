'use client'

import { useState, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
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
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
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
  const router = useRouter()
  const t = useTranslations()
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
      router.push(path)
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
      message.success({
        content: (
          <div>
            <div className="font-semibold">✅ {t('applications.applicationDeleted')}</div>
            <div className="text-xs mt-1">{t('applications.applicationDeletedDesc')}</div>
          </div>
        ),
        duration: 3,
      })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || t('applications.deleteError')
      
      if (errorMessage.includes('only delete pending applications') || 
          errorMessage.includes('Cannot delete processed application')) {
        message.error({
          content: (
            <div>
              <div className="font-semibold">🚫 {t('applications.cannotDeleteProcessed')}</div>
              <div>{t('applications.onlyPendingCanDelete')}</div>
              <div className="text-xs mt-1">{t('applications.alreadyProcessed')}</div>
            </div>
          ),
          duration: 5,
        })
      } else if (errorMessage.includes('not found') || errorMessage.includes('Not found')) {
        message.error({
          content: (
            <div>
              <div className="font-semibold">❌ {t('applications.applicationNotFound')}</div>
              <div>{t('applications.mayBeDeleted')}</div>
            </div>
          ),
          duration: 4,
        })
      } else if (errorMessage.includes('Forbidden') || errorMessage.includes('permission')) {
        message.error({
          content: (
            <div>
              <div className="font-semibold">🚫 {t('applications.accessDenied')}</div>
              <div>{t('applications.noPermissionDelete')}</div>
            </div>
          ),
          duration: 4,
        })
      } else {
        message.error({
          content: (
            <div>
              <div className="font-semibold">❌ {t('applications.deleteFailed')}</div>
              <div>{errorMessage}</div>
            </div>
          ),
          duration: 4,
        })
      }
    },
  })

  const approveApplicationMutation = useMutation({
    mutationFn: (applicationId: number) => apiClient.approveApplication(applicationId.toString()),
    onSuccess: () => {
      message.success({
        content: (
          <div>
            <div className="font-semibold">✅ {t('applications.applicationApproved')}</div>
            <div className="text-xs mt-1">{t('applications.applicantNotifiedApproval')}</div>
          </div>
        ),
        duration: 4,
      })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || t('applications.approveError')
      
      if (errorMessage.includes('already processed') || 
          errorMessage.includes('already approved') ||
          errorMessage.includes('not pending')) {
        message.error({
          content: (
            <div>
              <div className="font-semibold">⚠️ {t('applications.alreadyProcessedTitle')}</div>
              <div>{t('applications.alreadyApprovedOrRejected')}</div>
            </div>
          ),
          duration: 5,
        })
      } else if (errorMessage.includes('not found') || errorMessage.includes('Not found')) {
        message.error({
          content: (
            <div>
              <div className="font-semibold">❌ {t('applications.applicationNotFound')}</div>
              <div>{t('applications.mayNoLongerExist')}</div>
            </div>
          ),
          duration: 4,
        })
      } else if (errorMessage.includes('Forbidden') || errorMessage.includes('permission')) {
        message.error({
          content: (
            <div>
              <div className="font-semibold">🚫 {t('applications.accessDenied')}</div>
              <div>{t('applications.onlyManagersCanApprove')}</div>
            </div>
          ),
          duration: 5,
        })
      } else {
        message.error({
          content: (
            <div>
              <div className="font-semibold">❌ {t('applications.approvalFailed')}</div>
              <div>{errorMessage}</div>
            </div>
          ),
          duration: 4,
        })
      }
    },
  })

  const rejectApplicationMutation = useMutation({
    mutationFn: ({ applicationId, rejectionReason }: { applicationId: number; rejectionReason?: string }) =>
      apiClient.rejectApplication(applicationId.toString(), rejectionReason),
    onSuccess: () => {
      message.success({
        content: (
          <div>
            <div className="font-semibold">✅ {t('applications.applicationRejected')}</div>
            <div className="text-xs mt-1">{t('applications.applicantNotifiedRejection')}</div>
          </div>
        ),
        duration: 4,
      })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || t('applications.rejectError')
      
      if (errorMessage.includes('already processed') || 
          errorMessage.includes('already rejected') ||
          errorMessage.includes('not pending')) {
        message.error({
          content: (
            <div>
              <div className="font-semibold">⚠️ {t('applications.alreadyProcessedTitle')}</div>
              <div>{t('applications.alreadyApprovedOrRejected')}</div>
            </div>
          ),
          duration: 5,
        })
      } else if (errorMessage.includes('not found') || errorMessage.includes('Not found')) {
        message.error({
          content: (
            <div>
              <div className="font-semibold">❌ {t('applications.applicationNotFound')}</div>
              <div>{t('applications.mayNoLongerExist')}</div>
            </div>
          ),
          duration: 4,
        })
      } else if (errorMessage.includes('Forbidden') || errorMessage.includes('permission')) {
        message.error({
          content: (
            <div>
              <div className="font-semibold">🚫 {t('applications.accessDenied')}</div>
              <div>{t('applications.onlyManagersCanReject')}</div>
            </div>
          ),
          duration: 5,
        })
      } else {
        message.error({
          content: (
            <div>
              <div className="font-semibold">❌ {t('applications.rejectionFailed')}</div>
              <div>{errorMessage}</div>
            </div>
          ),
          duration: 4,
        })
      }
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
      title: t('applications.deleteApplicationTitle'),
      content: t('applications.deleteApplicationContent'),
      okText: t('applications.delete'),
      okType: 'danger',
      cancelText: t('applications.cancel'),
      onOk: () => deleteApplicationMutation.mutate(application.id),
    })
  }

  const handleApprove = (application: Application) => {
    Modal.confirm({
      title: t('applications.approveApplicationTitle'),
      content: t('applications.approveApplicationContent'),
      okText: t('applications.approve'),
      okType: 'primary',
      cancelText: t('applications.cancel'),
      onOk: () => approveApplicationMutation.mutate(application.id),
    })
  }

  const handleReject = (application: Application) => {
    let rejectionReason = ''
    Modal.confirm({
      title: t('applications.rejectApplicationTitle'),
      content: (
        <div>
          <p>{t('applications.rejectApplicationContent')}</p>
          <Input.TextArea
            placeholder={t('applications.reasonForRejection')}
            rows={3}
            onChange={(e) => (rejectionReason = e.target.value)}
            className="mt-2"
          />
        </div>
      ),
      okText: t('applications.reject'),
      okType: 'danger',
      cancelText: t('applications.cancel'),
      onOk: () => rejectApplicationMutation.mutate({ applicationId: application.id, rejectionReason }),
    })
  }

  const exportToExcel = () => {
    const data = applicationsData?.data || []
    const worksheet = XLSX.utils.json_to_sheet(
      data.map((application: Application) => ({
        [t('applications.submittedBy')]: application.userName,
        [t('applications.department')]: application.departmentName || t('applications.na'),
        [t('applications.title')]: application.title,
        [t('applications.type')]: application.applicationType,
        [t('applications.priority')]: application.priority,
        [t('applications.status')]: application.status,
        [t('applications.startDate')]: dayjs(application.startDate).format('YYYY-MM-DD'),
        [t('applications.endDate')]: dayjs(application.endDate).format('YYYY-MM-DD'),
        [t('applications.reason')]: application.reason,
        [t('applications.createdAt')]: dayjs(application.createdAt).format('YYYY-MM-DD HH:mm'),
      }))
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, t('applications.title'))
    XLSX.writeFile(workbook, `applications_${dayjs().format('YYYY-MM-DD')}.xlsx`)
    message.success(t('applications.exportedToExcel'))
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    const data = applicationsData?.data || []

    doc.setFontSize(18)
    doc.text(t('applications.applicationReport'), 14, 22)
    doc.setFontSize(11)
    doc.text(`${t('applications.generated')}: ${dayjs().format('YYYY-MM-DD HH:mm')}`, 14, 30)

    const tableData = data.map((application: Application) => [
      application.userName,
      application.departmentName || t('applications.na'),
      application.title,
      application.applicationType,
      application.priority,
      application.status,
      dayjs(application.startDate).format('YYYY-MM-DD'),
    ])

    ;(doc as any).autoTable({
      head: [[t('applications.submittedBy'), t('applications.department'), t('applications.title'), 
              t('applications.type'), t('applications.priority'), t('applications.status'), t('applications.startDate')]],
      body: tableData,
      startY: 35,
    })

    doc.save(`applications_${dayjs().format('YYYY-MM-DD')}.pdf`)
    message.success(t('applications.exportedToPDF'))
  }

  const handlePrint = () => {
    window.print()
    message.success(t('applications.printDialogOpened'))
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
    message.success(t('applications.filtersResetSuccess'))
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
      label: t('applications.exportToExcelBtn'),
      onClick: exportToExcel,
    },
    {
      key: 'pdf',
      icon: <FilePdfOutlined />,
      label: t('applications.exportToPDFBtn'),
      onClick: exportToPDF,
    },
    {
      type: 'divider',
    },
    {
      key: 'print',
      icon: <PrinterOutlined />,
      label: t('applications.printList'),
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
                {t('applications.export')}
              </EnhancedButton>
            </Dropdown>
            <EnhancedButton
              variant="primary"
              icon={<PlusOutlined />}
              onClick={() => handleNavigation(`/${locale}${basePath}/add`)}
            >
              {t('applications.addApplication')}
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
        placeholder={t('applications.searchByTitleReason')}
        value={searchText}
        onChange={(e) => {
          setSearchText(e.target.value)
          setPagination({ ...pagination, current: 1 })
        }}
      />

      <FilterBar>
        <FilterSelect
          placeholder={t('applications.status')}
          options={[
            { label: t('applications.pending'), value: 'pending' },
            { label: t('applications.approved'), value: 'approved' },
            { label: t('applications.rejected'), value: 'rejected' },
          ]}
          value={filters.status}
          onChange={(value) => {
            setFilters({ ...filters, status: value as string })
            setPagination({ ...pagination, current: 1 })
          }}
        />

        <FilterSelect
          placeholder={t('applications.filterByType')}
          options={[
            { label: t('applications.leave'), value: 'leave' },
            { label: t('applications.overtime'), value: 'overtime' },
            { label: t('applications.remoteWork'), value: 'remote' },
            { label: t('applications.other'), value: 'other' },
          ]}
          value={filters.applicationType}
          onChange={(value) => {
            setFilters({ ...filters, applicationType: value as string })
            setPagination({ ...pagination, current: 1 })
          }}
        />

        <FilterSelect
          placeholder={t('applications.filterByPriority')}
          options={[
            { label: t('applications.low'), value: 'low' },
            { label: t('applications.medium'), value: 'medium' },
            { label: t('applications.high'), value: 'high' },
            { label: t('applications.urgent'), value: 'urgent' },
          ]}
          value={filters.priority}
          onChange={(value) => {
            setFilters({ ...filters, priority: value as string })
            setPagination({ ...pagination, current: 1 })
          }}
        />

        {role === 'admin' && (
          <FilterSelect
            placeholder={t('applications.filterByDepartment')}
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
            {t('applications.refresh')}
          </EnhancedButton>
          <EnhancedButton
            variant="secondary"
            icon={<ClearOutlined />}
            onClick={handleResetFilters}
          >
            {t('applications.clearFilters')}
          </EnhancedButton>
        </div>
      </FilterBar>

      {applicationsData?.data?.length === 0 && !isLoading ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('applications.noApplicationsFound')}
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
