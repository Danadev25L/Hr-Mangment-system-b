'use client'

import { useState, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message, Modal, Table, Tag, Space, Tooltip, Segmented, Calendar, Badge, Empty } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import type { BadgeProps } from 'antd'
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
  CalendarOutlined,
  UnorderedListOutlined,
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
  EnhancedButton,
  EnhancedCard,
} from '@/components/ui'
import { HolidaysIllustration } from '@/components/ui/illustrations/HolidaysIllustration'
import type { MenuProps } from 'antd'

const { confirm } = Modal

interface HolidayListPageProps {
  role: 'admin' | 'manager' | 'employee'
  title: string
  description: string
}

export function HolidayListPage({ role, title, description }: HolidayListPageProps) {
  const locale = useLocale()
  const t = useTranslations()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()

  const [searchText, setSearchText] = useState(searchParams?.get('search') || '')
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>((searchParams?.get('view') as any) || 'table')
  const [pagination, setPagination] = useState({
    current: parseInt(searchParams?.get('page') || '1'),
    pageSize: parseInt(searchParams?.get('pageSize') || '10'),
  })

  const basePath = role === 'admin' ? '/admin/holidays' : role === 'manager' ? '/manager/holidays' : '/employee/holidays'

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
    params.set('view', viewMode)
    params.set('page', pagination.current.toString())
    params.set('pageSize', pagination.pageSize.toString())
    
    const newUrl = `/${locale}${basePath}?${params.toString()}`
    window.history.replaceState({}, '', newUrl)
  }, [searchText, viewMode, pagination, locale, basePath])

  // Fetch holidays
  const { data: holidaysData, isLoading, refetch } = useQuery({
    queryKey: ['holidays', role],
    queryFn: () => apiClient.getHolidays(),
  })

  // Delete mutation (admin only)
  const deleteHolidayMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteHoliday(id),
    onSuccess: () => {
      message.success(t('holidays.deleteSuccess'))
      queryClient.invalidateQueries({ queryKey: ['holidays'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || t('holidays.deleteError'))
    },
  })

  const handleDelete = (id: number, name: string) => {
    confirm({
      title: t('holidays.deleteHoliday'),
      content: t('holidays.deleteConfirm', { name }),
      okText: t('common.delete'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      onOk: () => deleteHolidayMutation.mutate(id),
    })
  }

  const handleView = (id: number) => {
    handleNavigation(`/${locale}${basePath}/${id}`)
  }

  const holidays = Array.isArray(holidaysData)
    ? holidaysData
    : holidaysData?.holidays || []

  // Filter holidays
  const filteredHolidays = holidays.filter((holiday: any) =>
    !searchText ||
    holiday.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    holiday.description?.toLowerCase().includes(searchText.toLowerCase())
  )

  // Calculate statistics
  const today = dayjs()
  const stats = {
    total: filteredHolidays.length,
    upcoming: filteredHolidays.filter((h: any) => 
      dayjs(h.date).isAfter(today) || dayjs(h.date).isSame(today, 'day')
    ).length,
    past: filteredHolidays.filter((h: any) => dayjs(h.date).isBefore(today, 'day')).length,
    recurring: filteredHolidays.filter((h: any) => h.isRecurring).length,
  }

  // Export functions
  const exportToExcel = () => {
    if (filteredHolidays.length === 0) {
      message.warning(t('common.noDataToExport'))
      return
    }

    const exportData = filteredHolidays.map((holiday: any) => ({
      [t('holidays.holidayName')]: holiday.name,
      [t('holidays.date')]: dayjs(holiday.date).format('MMM DD, YYYY'),
      [t('holidays.description')]: holiday.description || t('holidays.noDescription'),
      [t('holidays.type')]: holiday.isRecurring ? t('holidays.recurring') : t('holidays.oneTime'),
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Holidays')
    XLSX.writeFile(wb, `holidays-${dayjs().format('YYYY-MM-DD')}.xlsx`)
    message.success(t('common.exportSuccess'))
  }

  const exportToPDF = () => {
    if (filteredHolidays.length === 0) {
      message.warning(t('common.noDataToExport'))
      return
    }

    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text(title, 14, 20)
    
    autoTable(doc, {
      startY: 30,
      head: [[
        t('holidays.holidayName'),
        t('holidays.date'),
        t('holidays.type'),
      ]],
      body: filteredHolidays.map((holiday: any) => [
        holiday.name,
        dayjs(holiday.date).format('MMM DD, YYYY'),
        holiday.isRecurring ? t('holidays.recurring') : t('holidays.oneTime'),
      ]),
    })

    doc.save(`holidays-${dayjs().format('YYYY-MM-DD')}.pdf`)
    message.success('PDF exported successfully')
  }

  const handlePrint = () => {
    if (typeof window === 'undefined') return
    window.print()
  }

  const handleClearFilters = () => {
    setSearchText('')
    setPagination({ current: 1, pageSize: 10 })
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
      key: 'print',
      icon: <PrinterOutlined />,
      label: 'Print',
      onClick: handlePrint,
    },
  ]

  // Calendar helpers
  const getListData = (value: Dayjs) => {
    const listData: { type: BadgeProps['status']; content: string }[] = []
    
    holidays.forEach((holiday: any) => {
      if (dayjs(holiday.date).isSame(value, 'day')) {
        listData.push({
          type: 'success',
          content: holiday.name || t('holidays.unnamedHoliday'),
        })
      }
    })
    
    return listData
  }

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value)
    return (
      <ul className="list-none p-0 m-0">
        {listData.map((item, index) => (
          <li key={index}>
            <Badge status={item.type} text={item.content} />
          </li>
        ))}
      </ul>
    )
  }

  // Get days until holiday
  const getDaysUntil = (date: string) => {
    const diff = dayjs(date).diff(today, 'day')
    if (diff === 0) return t('holidays.today')
    if (diff < 0) return t('holidays.past')
    const days = Math.abs(diff)
    const unit = days === 1 ? t('holidays.day') : t('holidays.days')
    return t('holidays.inDays', { days, unit })
  }

  const columns: ColumnsType<any> = [
    {
      title: t('holidays.holidayName'),
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Space>
          <CalendarOutlined className="text-green-500" />
          <span className="font-medium">{text || t('holidays.unnamedHoliday')}</span>
          {record.isRecurring && (
            <Tag color="cyan">{t('holidays.recurring')}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: t('holidays.date'),
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => (
        <Space direction="vertical" size="small">
          <span>{dayjs(date).format('MMM DD, YYYY')}</span>
          <Tag color={dayjs(date).isBefore(today, 'day') ? 'default' : 'green'}>
            {getDaysUntil(date)}
          </Tag>
        </Space>
      ),
      sorter: (a: any, b: any) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: t('holidays.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span className="text-gray-600">{text || t('holidays.noDescription')}</span>
        </Tooltip>
      ),
    },
    {
      title: t('holidays.actions'),
      key: 'actions',
      fixed: 'right',
      width: 80,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title={t('holidays.viewDetails')}>
            <EnhancedButton
              variant="ghost"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record.id)}
            />
          </Tooltip>
          {role === 'admin' && (
            <>
              <Tooltip title={t('common.edit')}>
                <EnhancedButton
                  variant="ghost"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleNavigation(`/${locale}${basePath}/${record.id}/edit`)}
                />
              </Tooltip>
              <Tooltip title={t('common.delete')}>
                <EnhancedButton
                  variant="ghost"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(record.id, record.name)}
                />
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
        icon={<HolidaysIllustration className="w-20 h-20" />}
        gradient="green"
        action={
          <div className="flex items-center gap-3">
            {role === 'admin' && (
              <EnhancedButton
                variant="primary"
                icon={<PlusOutlined />}
                onClick={() => handleNavigation(`/${locale}${basePath}/add`)}
              >
                {t('holidays.addHoliday')}
              </EnhancedButton>
            )}
            <EnhancedButton
              variant="secondary"
              icon={<ExportOutlined />}
              dropdown={{ menu: { items: exportMenuItems } }}
            >
              {t('common.export')}
            </EnhancedButton>
          </div>
        }
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <EnhancedCard className="bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('holidays.totalHolidays')}</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.total}</p>
            </div>
            <CalendarOutlined className="text-4xl text-green-500 opacity-50" />
          </div>
        </EnhancedCard>

        <EnhancedCard className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('holidays.upcomingHolidays')}</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.upcoming}</p>
            </div>
            <CalendarOutlined className="text-4xl text-blue-500 opacity-50" />
          </div>
        </EnhancedCard>

        <EnhancedCard className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/20 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('holidays.pastHolidays')}</p>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.past}</p>
            </div>
            <CalendarOutlined className="text-4xl text-gray-500 opacity-50" />
          </div>
        </EnhancedCard>

        <EnhancedCard className="bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-900/20 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('holidays.recurring')}</p>
              <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{stats.recurring}</p>
            </div>
            <ReloadOutlined className="text-4xl text-cyan-500 opacity-50" />
          </div>
        </EnhancedCard>
      </div>

      {/* Filters and View Mode */}
      <EnhancedCard>
        <FilterBar
          searchComponent={
            <SearchInput
              placeholder={t('holidays.searchPlaceholder')}
              value={searchText}
              onChange={setSearchText}
              onClear={() => setSearchText('')}
            />
          }
          filterComponents={
            <Segmented
              value={viewMode}
              onChange={(value) => setViewMode(value as 'table' | 'calendar')}
              size="large"
              options={[
                {
                  label: t('holidays.listView'),
                  value: 'table',
                  icon: <UnorderedListOutlined />,
                },
                {
                  label: t('holidays.calendarView'),
                  value: 'calendar',
                  icon: <CalendarOutlined />,
                },
              ]}
            />
          }
          actionButtons={
            <>
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
            </>
          }
        />
      </EnhancedCard>

      {/* Content - Table or Calendar */}
      <EnhancedCard>
        {viewMode === 'table' ? (
          filteredHolidays.length === 0 && !isLoading ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('holidays.noHolidays') || 'No holidays found'}
            />
          ) : (
            <Table
              columns={columns}
              dataSource={filteredHolidays}
              rowKey="id"
              loading={isLoading}
              scroll={{ x: 'max-content' }}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showTotal: (total) => t('holidays.totalItems', { total }),
                onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
              }}
            />
          )
        ) : (
          <Calendar dateCellRender={dateCellRender} />
        )}
      </EnhancedCard>
    </div>
  )
}
