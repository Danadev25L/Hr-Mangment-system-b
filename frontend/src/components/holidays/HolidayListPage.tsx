'use client'

import React, { useState } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Breadcrumb,
  Dropdown,
  message,
  Modal,
  Typography,
  Calendar,
  Badge,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import type { BadgeProps } from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  HomeOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'

const { confirm } = Modal
const { Text, Title } = Typography

interface HolidayListPageProps {
  role: 'admin' | 'manager' | 'employee'
}

export function HolidayListPage({ role }: HolidayListPageProps) {
  const t = useTranslations()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchText, setSearchText] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table')

  const basePath = role === 'admin' ? '/admin' : role === 'manager' ? '/manager' : '/employee'
  const dashboardPath = `${basePath}/dashboard`
  const listPath = `${basePath}/holidays`
  const addPath = `${basePath}/holidays/add`

  // Fetch holidays
  const { data: holidaysData, isLoading } = useQuery({
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
      content: t('holidays.deleteConfirm', { name: name || t('holidays.unnamedHoliday') }),
      okText: t('common.delete'),
      okType: 'danger',
      onOk: () => deleteHolidayMutation.mutate(id),
    })
  }

  const handleView = (id: number) => {
    router.push(`${listPath}/${id}`)
  }

  const holidays = Array.isArray(holidaysData)
    ? holidaysData
    : holidaysData?.holidays || []

  const filteredHolidays = holidays.filter((holiday: any) =>
    holiday.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    holiday.description?.toLowerCase().includes(searchText.toLowerCase())
  )

  // Calculate upcoming and past holidays
  const today = dayjs()
  const upcomingHolidays = filteredHolidays.filter((holiday: any) =>
    dayjs(holiday.date).isAfter(today) || dayjs(holiday.date).isSame(today, 'day')
  )
  const pastHolidays = filteredHolidays.filter((holiday: any) =>
    dayjs(holiday.date).isBefore(today, 'day')
  )

  const columns: ColumnsType<any> = [
    {
      title: t('holidays.date'),
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => (
        <Space>
          <CalendarOutlined />
          <span>{dayjs(date).format('MMMM DD, YYYY')}</span>
          {dayjs(date).isSame(today, 'day') && (
            <Tag color="green">{t('holidays.today')}</Tag>
          )}
        </Space>
      ),
      sorter: (a: any, b: any) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      defaultSortOrder: 'ascend',
    },
    {
      title: t('holidays.holidayName'),
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text || t('holidays.unnamedHoliday')}</Text>,
    },
    {
      title: t('holidays.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => (
        <Text ellipsis style={{ maxWidth: 400 }}>
          {text || t('holidays.noDescription')}
        </Text>
      ),
    },
    {
      title: t('holidays.type'),
      dataIndex: 'isRecurring',
      key: 'isRecurring',
      render: (isRecurring: boolean) => (
        <Tag color={isRecurring ? 'blue' : 'default'}>
          {isRecurring ? t('holidays.recurring') : t('holidays.oneTime')}
        </Tag>
      ),
      filters: [
        { text: t('holidays.recurring'), value: true },
        { text: t('holidays.oneTime'), value: false },
      ],
      onFilter: (value: any, record: any) => record.isRecurring === value,
    },
    {
      title: t('holidays.status'),
      key: 'status',
      render: (_: any, record: any) => {
        const holidayDate = dayjs(record.date)
        const isToday = holidayDate.isSame(today, 'day')
        const isPast = holidayDate.isBefore(today, 'day')

        if (isToday) {
          return <Tag color="green" icon={<CheckCircleOutlined />}>{t('holidays.today')}</Tag>
        } else if (isPast) {
          return <Tag color="default">{t('holidays.past')}</Tag>
        } else {
          const daysUntil = holidayDate.diff(today, 'days')
          return (
            <Tag color="blue">
              {t('holidays.inDays', { 
                days: daysUntil, 
                unit: daysUntil === 1 ? t('holidays.day') : t('holidays.days')
              })}
            </Tag>
          )
        }
      },
    },
    {
      title: t('holidays.actions'),
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_: any, record: any) => {
        const menuItems: any[] = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: t('holidays.viewDetails'),
            onClick: () => handleView(record.id),
          },
        ]

        if (role === 'admin') {
          menuItems.push(
            {
              key: 'edit',
              icon: <EditOutlined />,
              label: t('common.edit'),
              onClick: () => router.push(`${listPath}/${record.id}/edit`),
            },
            {
              key: 'delete',
              icon: <DeleteOutlined />,
              label: t('common.delete'),
              danger: true,
              onClick: () => handleDelete(record.id, record.name),
            }
          )
        }

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        )
      },
    },
  ]

  // Calendar mode
  const getListData = (value: Dayjs) => {
    const listData: { type: BadgeProps['status']; content: string }[] = []
    
    holidays.forEach((holiday: any) => {
      if (dayjs(holiday.date).isSame(value, 'day')) {
        listData.push({
          type: 'success',
          content: holiday.name || 'Holiday',
        })
      }
    })
    
    return listData
  }

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value)
    return (
      <ul className="events" style={{ listStyle: 'none', padding: 0 }}>
        {listData.map((item, index) => (
          <li key={index}>
            <Badge status={item.type} text={item.content} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          {
            title: (
              <span className="flex items-center cursor-pointer" onClick={() => router.push(dashboardPath)}>
                <HomeOutlined className="mr-1" />
                {t('common.dashboard')}
              </span>
            ),
          },
          {
            title: t('holidays.title'),
          },
        ]}
      />

      {/* Page Header */}
      <Card>
        <div className="flex justify-between items-center">
          <div>
            <Title level={2} className="m-0">
              {t('holidays.title')}
            </Title>
            <Text type="secondary">
              {role === 'admin' ? t('holidays.subtitle') : t('holidays.subtitleView')}
            </Text>
          </div>
          <Space>
            <Button
              type={viewMode === 'table' ? 'primary' : 'default'}
              icon={<CalendarOutlined />}
              onClick={() => setViewMode('table')}
            >
              {t('holidays.listView')}
            </Button>
            <Button
              type={viewMode === 'calendar' ? 'primary' : 'default'}
              icon={<CalendarOutlined />}
              onClick={() => setViewMode('calendar')}
            >
              {t('holidays.calendarView')}
            </Button>
            {role === 'admin' && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push(addPath)}
              >
                {t('holidays.addHoliday')}
              </Button>
            )}
          </Space>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <Text type="secondary">{t('holidays.totalHolidays')}</Text>
              <div className="text-2xl font-bold">{holidays.length}</div>
            </div>
            <CalendarOutlined className="text-4xl text-blue-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <Text type="secondary">{t('holidays.upcomingHolidays')}</Text>
              <div className="text-2xl font-bold text-green-600">{upcomingHolidays.length}</div>
            </div>
            <CheckCircleOutlined className="text-4xl text-green-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <Text type="secondary">{t('holidays.pastHolidays')}</Text>
              <div className="text-2xl font-bold text-gray-500">{pastHolidays.length}</div>
            </div>
            <CloseCircleOutlined className="text-4xl text-gray-400" />
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      {viewMode === 'table' && (
        <Card>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Input
              placeholder={t('holidays.searchPlaceholder')}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size="large"
            />
          </Space>
        </Card>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <Card>
          <Table
            columns={columns}
            dataSource={filteredHolidays}
            rowKey="id"
            loading={isLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => t('holidays.totalItems', { total }),
            }}
          />
        </Card>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <Card>
          <Calendar dateCellRender={dateCellRender} />
        </Card>
      )}
    </div>
  )
}
