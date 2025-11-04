'use client'

import React, { useState } from 'react'
import {
  Card,
  Button,
  Space,
  Input,
  Breadcrumb,
  message,
  Modal,
  Typography,
  Calendar,
  Badge,
  Empty,
  Segmented,
} from 'antd'
import type { Dayjs } from 'dayjs'
import type { BadgeProps } from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  HomeOutlined,
  CalendarOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { HolidayTable, type Holiday } from './HolidayTable'
import { HolidayStats } from './HolidayStats'

const { confirm } = Modal
const { Title } = Typography

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
  const { data: holidaysData, isLoading, refetch } = useQuery({
    queryKey: ['holidays', role],
    queryFn: () => apiClient.getHolidays(),
  })

  // Delete mutation (admin only)
  const deleteHolidayMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteHoliday(id),
    onSuccess: () => {
      message.success('Holiday deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['holidays'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to delete holiday')
    },
  })

  const handleView = (record: Holiday) => {
    router.push(`${listPath}/${record.id}`)
  }

  const handleEdit = (record: Holiday) => {
    router.push(`${listPath}/${record.id}/edit`)
  }

  const handleDelete = (id: number, name: string) => {
    confirm({
      title: 'Delete Holiday',
      content: `Are you sure you want to delete "${name}"?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => deleteHolidayMutation.mutate(id),
    })
  }

  const holidays = Array.isArray(holidaysData)
    ? holidaysData
    : holidaysData?.holidays || []

  const filteredHolidays = holidays.filter((holiday: any) =>
    holiday.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    holiday.description?.toLowerCase().includes(searchText.toLowerCase())
  )

  // Calculate statistics
  const today = dayjs()
  const upcomingHolidays = filteredHolidays.filter((holiday: any) =>
    dayjs(holiday.date).isAfter(today) || dayjs(holiday.date).isSame(today, 'day')
  )
  const pastHolidays = filteredHolidays.filter((holiday: any) =>
    dayjs(holiday.date).isBefore(today, 'day')
  )
  const recurringHolidays = filteredHolidays.filter((holiday: any) => holiday.isRecurring)

  // Calendar mode helpers
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
      <ul className="list-none p-0">
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
              <span className="flex items-center cursor-pointer hover:text-blue-600 transition-colors" onClick={() => router.push(dashboardPath)}>
                <HomeOutlined className="mr-1" />
                Dashboard
              </span>
            ),
          },
          {
            title: (
              <span className="flex items-center">
                <CalendarOutlined className="mr-1" />
                Holidays
              </span>
            ),
          },
        ]}
      />

      {/* Header */}
      <Card className="shadow-lg border-t-4 border-t-green-500">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <CalendarOutlined className="text-white text-2xl" />
            </div>
            <div>
              <Title level={2} className="!mb-1 !text-gray-900 dark:!text-gray-100">
                Holidays
              </Title>
              <p className="text-gray-500 dark:text-gray-400 m-0">
                {role === 'admin' ? 'Manage company holidays and events' : 'View company holidays and events'}
              </p>
            </div>
          </div>
          <Space>
            {role === 'admin' && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => router.push(addPath)}
                className="bg-gradient-to-r from-green-500 to-teal-600 border-none hover:from-green-600 hover:to-teal-700 shadow-md"
              >
                Add Holiday
              </Button>
            )}
          </Space>
        </div>
      </Card>

      {/* Statistics */}
      <HolidayStats
        total={filteredHolidays.length}
        upcoming={upcomingHolidays.length}
        past={pastHolidays.length}
        recurring={recurringHolidays.length}
      />

      {/* Filters and View Toggle */}
      <Card className="shadow-md">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <Input
              placeholder="Search holidays by name or description..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size="large"
              className="flex-1 max-w-md"
            />
            <Segmented
              value={viewMode}
              onChange={(value) => setViewMode(value as 'table' | 'calendar')}
              size="large"
              options={[
                {
                  label: 'List View',
                  value: 'table',
                  icon: <UnorderedListOutlined />,
                },
                {
                  label: 'Calendar View',
                  value: 'calendar',
                  icon: <CalendarOutlined />,
                },
              ]}
            />
          </div>
        </Space>
      </Card>

      {/* Content - Table or Calendar */}
      {viewMode === 'table' ? (
        <Card className="shadow-md">
          {filteredHolidays.length === 0 && !isLoading ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No holidays found"
            />
          ) : (
            <HolidayTable
              data={filteredHolidays}
              loading={isLoading}
              onView={handleView}
              onEdit={role === 'admin' ? handleEdit : undefined}
              onDelete={role === 'admin' ? handleDelete : undefined}
              role={role}
            />
          )}
        </Card>
      ) : (
        <Card className="shadow-md">
          <Calendar dateCellRender={dateCellRender} />
        </Card>
      )}
    </div>
  )
}
