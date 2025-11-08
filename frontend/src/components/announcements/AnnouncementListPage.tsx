'use client'

import { useState, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message, Modal, Table, Tag, Space, Avatar, Tooltip, Dropdown, Row, Col } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  PlusOutlined,
  ExportOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  ReloadOutlined,
  ClearOutlined,
  PrinterOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  NotificationOutlined,
  CheckCircleOutlined,
  PoweroffOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useSearchParams } from 'next/navigation'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import apiClient from '@/lib/api'
import {
  PageHeader,
  SearchInput,
  FilterBar,
  FilterSelect,
  EnhancedButton,
  EnhancedCard,
  AvatarWithInitials,
} from '@/components/ui'
import { AnnouncementsIllustration } from '@/components/ui/illustrations/AnnouncementsIllustration'
import type { MenuProps } from 'antd'

const { confirm } = Modal

interface AnnouncementListPageProps {
  role: 'admin' | 'manager' | 'employee'
  title: string
  description: string
}

export function AnnouncementListPage({ role, title, description }: AnnouncementListPageProps) {
  const locale = useLocale()
  const t = useTranslations()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()

  const [searchText, setSearchText] = useState(searchParams?.get('search') || '')
  const [filters, setFilters] = useState({
    status: searchParams?.get('status') || undefined,
    department: searchParams?.get('department') || undefined,
  })
  const [pagination, setPagination] = useState({
    current: parseInt(searchParams?.get('page') || '1'),
    pageSize: parseInt(searchParams?.get('pageSize') || '10'),
  })

  const basePath = role === 'admin' ? '/admin/announcements' : role === 'manager' ? '/manager/announcements' : '/employee/announcements'

  const handleNavigation = (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path
    }
  }

  // Update URL params when filters change
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const params = new URLSearchParams()
    if (searchText) params.set('search', searchText)
    if (filters.status) params.set('status', filters.status)
    if (filters.department) params.set('department', filters.department)
    params.set('page', pagination.current.toString())
    params.set('pageSize', pagination.pageSize.toString())
    
    const newUrl = `/${locale}${basePath}?${params.toString()}`
    window.history.replaceState({}, '', newUrl)
  }, [searchText, filters, pagination, locale, basePath])

  // Fetch announcements
  const { data: announcementsData, isLoading, refetch } = useQuery<any>({
    queryKey: ['announcements', role],
    queryFn: () => apiClient.getAnnouncements(),
  })

  // Fetch departments (for admin filter)
  const { data: departmentsData } = useQuery<any>({
    queryKey: ['departments'],
    queryFn: () => apiClient.getDepartments(),
    enabled: role === 'admin',
  })

  // Delete mutation
  const deleteAnnouncementMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteAnnouncement(id),
    onSuccess: () => {
      message.success(t('announcements.deleteSuccess'))
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || t('announcements.deleteError'))
    },
  })

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (id: number) => apiClient.toggleAnnouncementStatus(id),
    onSuccess: () => {
      message.success(t('announcements.statusUpdateSuccess'))
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || t('announcements.statusUpdateError'))
    },
  })

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => apiClient.markAnnouncementAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
  })

  const handleDelete = (id: number, title: string) => {
    confirm({
      title: t('announcements.deleteAnnouncement'),
      content: t('announcements.deleteConfirm', { title }),
      okText: t('common.delete'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      onOk: () => deleteAnnouncementMutation.mutate(id),
    })
  }

  const handleView = (id: number) => {
    handleNavigation(`/${locale}${basePath}/${id}`)
    if (role === 'employee') {
      markAsReadMutation.mutate(id)
    }
  }

  const announcements = Array.isArray(announcementsData)
    ? announcementsData
    : announcementsData?.announcements || []

  const departments = Array.isArray(departmentsData)
    ? departmentsData
    : departmentsData?.data || []

  // Filter announcements
  const filteredAnnouncements = announcements.filter((announcement: any) => {
    const matchesSearch = !searchText || 
      announcement.title?.toLowerCase().includes(searchText.toLowerCase()) ||
      announcement.description?.toLowerCase().includes(searchText.toLowerCase())
    
    const matchesStatus = !filters.status || 
      (filters.status === 'active' && announcement.isActive) ||
      (filters.status === 'inactive' && !announcement.isActive)
    
    const matchesDepartment = !filters.department || 
      announcement.department?.id?.toString() === filters.department

    return matchesSearch && matchesStatus && matchesDepartment
  })

  // Calculate statistics
  const stats = {
    total: filteredAnnouncements.length,
    active: filteredAnnouncements.filter((a: any) => a.isActive).length,
    inactive: filteredAnnouncements.filter((a: any) => !a.isActive).length,
    unread: role === 'employee' ? filteredAnnouncements.filter((a: any) => !a.isRead).length : 0,
  }

  // Export functions
  const exportToExcel = () => {
    if (filteredAnnouncements.length === 0) {
      message.warning(t('common.noDataToExport'))
      return
    }

    const exportData = filteredAnnouncements.map((announcement: any) => ({
      [t('announcements.announcementTitle')]: announcement.title,
      [t('announcements.description')]: announcement.description,
      [t('announcements.department')]: announcement.department?.departmentName || t('announcements.notAvailable'),
      [t('announcements.date')]: dayjs(announcement.date).format('MMM DD, YYYY'),
      [t('announcements.status')]: announcement.isActive ? t('announcements.active') : t('announcements.inactive'),
      [t('announcements.createdBy')]: announcement.creator?.fullName || t('announcements.unknown'),
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Announcements')
    XLSX.writeFile(wb, `announcements-${dayjs().format('YYYY-MM-DD')}.xlsx`)
    message.success(t('common.exportSuccess'))
  }

  const exportToPDF = () => {
    if (filteredAnnouncements.length === 0) {
      message.warning(t('common.noDataToExport'))
      return
    }

    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text(title, 14, 20)
    
    autoTable(doc, {
      startY: 30,
      head: [[
        t('announcements.announcementTitle'),
        t('announcements.department'),
        t('announcements.date'),
        t('announcements.status'),
      ]],
      body: filteredAnnouncements.map((announcement: any) => [
        announcement.title,
        announcement.department?.departmentName || t('announcements.notAvailable'),
        dayjs(announcement.date).format('MMM DD, YYYY'),
        announcement.isActive ? t('announcements.active') : t('announcements.inactive'),
      ]),
    })

    doc.save(`announcements-${dayjs().format('YYYY-MM-DD')}.pdf`)
    message.success(t('common.exportSuccess'))
  }

  const handlePrint = () => {
    if (typeof window === 'undefined') return
    window.print()
  }

  const handleClearFilters = () => {
    setSearchText('')
    setFilters({
      status: undefined,
      department: undefined,
    })
    setPagination({ current: 1, pageSize: 10 })
  }

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'excel',
      icon: <FileExcelOutlined />,
      label: t('applications.exportToExcel'),
      onClick: exportToExcel,
    },
    {
      key: 'pdf',
      icon: <FilePdfOutlined />,
      label: t('applications.exportToPDF'),
      onClick: exportToPDF,
    },
    {
      key: 'print',
      icon: <PrinterOutlined />,
      label: t('common.print'),
      onClick: handlePrint,
    },
  ]

  const columns: ColumnsType<any> = [
    {
      title: t('announcements.announcementTitle'),
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <Space>
          <NotificationOutlined className="text-amber-500" />
          <span className="font-medium">{text}</span>
          {role === 'employee' && record.isRead && (
            <Tag color="green" icon={<CheckCircleOutlined />}>{t('announcements.read')}</Tag>
          )}
          {role === 'employee' && !record.isRead && (
            <Tag color="orange">{t('announcements.unread')}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: t('announcements.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span className="text-gray-600">{text}</span>
        </Tooltip>
      ),
    },
    ...(role !== 'employee' ? [{
      title: t('announcements.department'),
      dataIndex: ['department', 'departmentName'],
      key: 'department',
      render: (text: string) => (
        <Tag color="blue">{text || t('announcements.notAvailable')}</Tag>
      ),
    }] : []),
    {
      title: t('announcements.date'),
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a: any, b: any) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    ...(role !== 'employee' ? [{
      title: t('announcements.status'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? t('announcements.active') : t('announcements.inactive')}
        </Tag>
      ),
    }] : []),
    {
      title: t('announcements.createdBy'),
      dataIndex: ['creator', 'fullName'],
      key: 'creator',
      render: (text: string) => (
        <div className="flex items-center space-x-3">
          <AvatarWithInitials name={text || t('announcements.unknown')} size="md" />
          <span className="font-medium">{text || t('announcements.unknown')}</span>
        </div>
      ),
    },
    {
      title: t('announcements.actions'),
      key: 'actions',
      fixed: 'right',
      width: 80,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title={t('announcements.viewDetails')}>
            <EnhancedButton
              variant="ghost"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record.id)}
            >
              {null}
            </EnhancedButton>
          </Tooltip>
          {(role === 'admin' || role === 'manager') && (
            <>
              <Tooltip title={t('common.edit')}>
                <EnhancedButton
                  variant="ghost"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleNavigation(`/${locale}${basePath}/${record.id}/edit`)}
                >
                  {null}
                </EnhancedButton>
              </Tooltip>
              <Tooltip title={t('common.delete')}>
                <EnhancedButton
                  variant="ghost"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(record.id, record.title)}
                >
                  {null}
                </EnhancedButton>
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        icon={<AnnouncementsIllustration className="w-20 h-20" />}
        gradient="amber"
        action={
          <div className="flex items-center gap-3">
            {(role === 'admin' || role === 'manager') && (
              <EnhancedButton
                variant="primary"
                icon={<PlusOutlined />}
                onClick={() => handleNavigation(`/${locale}${basePath}/add`)}
              >
                {t('announcements.createAnnouncement')}
              </EnhancedButton>
            )}
            <Dropdown menu={{ items: exportMenuItems }}>
              <EnhancedButton
                variant="secondary"
                icon={<ExportOutlined />}
              >
                {t('common.export')}
              </EnhancedButton>
            </Dropdown>
          </div>
        }
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <EnhancedCard className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('announcements.title')}</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.total}</p>
            </div>
            <NotificationOutlined className="text-4xl text-amber-500 opacity-50" />
          </div>
        </EnhancedCard>

        {role !== 'employee' ? (
          <>
            <EnhancedCard className="bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('announcements.active')}</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
                </div>
                <CheckCircleOutlined className="text-4xl text-green-500 opacity-50" />
              </div>
            </EnhancedCard>

            <EnhancedCard className="bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('announcements.inactive')}</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.inactive}</p>
                </div>
                <PoweroffOutlined className="text-4xl text-red-500 opacity-50" />
              </div>
            </EnhancedCard>
          </>
        ) : (
          <EnhancedCard className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('announcements.unread')}</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.unread}</p>
              </div>
              <NotificationOutlined className="text-4xl text-orange-500 opacity-50" />
            </div>
          </EnhancedCard>
        )}
      </div>

      {/* Filters */}
      <EnhancedCard>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <SearchInput
              placeholder={t('announcements.searchPlaceholder')}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          {role !== 'employee' && (
            <Col xs={24} sm={12} md={4}>
              <FilterSelect
                placeholder={t('announcements.status')}
                value={filters.status}
                onChange={(value) => setFilters({ ...filters, status: value as string | undefined })}
                options={[
                  { label: t('announcements.active'), value: 'active' },
                  { label: t('announcements.inactive'), value: 'inactive' },
                ]}
                allowClear
              />
            </Col>
          )}
          {role === 'admin' && (
            <Col xs={24} sm={12} md={4}>
              <FilterSelect
                placeholder={t('announcements.department')}
                value={filters.department}
                onChange={(value) => setFilters({ ...filters, department: value as string | undefined })}
                options={departments.map((dept: any) => ({
                  label: dept.departmentName || dept.name,
                  value: dept.id.toString(),
                }))}
                allowClear
              />
            </Col>
          )}
          <Col flex="auto">
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <EnhancedButton
                variant="ghost"
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
              >
                {t('common.refresh')}
              </EnhancedButton>
              <EnhancedButton
                variant="ghost"
                icon={<ClearOutlined />}
                onClick={handleClearFilters}
              >
                {t('common.cancel')}
              </EnhancedButton>
            </div>
          </Col>
        </Row>
      </EnhancedCard>

      {/* Table */}
      <EnhancedCard>
        <Table
          columns={columns}
          dataSource={filteredAnnouncements}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 'max-content' }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => t('announcements.totalItems', { total }),
            onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
          }}
        />
      </EnhancedCard>
    </div>
  )
}
