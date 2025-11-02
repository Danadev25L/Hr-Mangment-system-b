'use client'

import React from 'react'
import {
  Card,
  Button,
  Space,
  Tag,
  Breadcrumb,
  message,
  Spin,
  Empty,
  Descriptions,
  Typography,
} from 'antd'
import {
  ArrowLeftOutlined,
  HomeOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'

const { Title, Paragraph, Text } = Typography

interface HolidayViewPageProps {
  role: 'admin' | 'manager' | 'employee'
  id: string
}

export function HolidayViewPage({ role, id }: HolidayViewPageProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const basePath = role === 'admin' ? '/admin' : role === 'manager' ? '/manager' : '/employee'
  const listPath = `${basePath}/holidays`
  const dashboardPath = `${basePath}/dashboard`

  // Fetch holiday details
  const { data: holiday, isLoading } = useQuery({
    queryKey: ['holiday', id],
    queryFn: () => apiClient.getHoliday(parseInt(id)),
  })

  // Delete mutation (admin only)
  const deleteHolidayMutation = useMutation({
    mutationFn: (holidayId: number) => apiClient.deleteHoliday(holidayId),
    onSuccess: () => {
      message.success('Holiday deleted successfully')
      router.push(listPath)
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to delete holiday')
    },
  })

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this holiday?')) {
      deleteHolidayMutation.mutate(parseInt(id))
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    )
  }

  if (!holiday) {
    return (
      <Card>
        <Empty description="Holiday not found" />
        <div className="text-center mt-4">
          <Button onClick={() => router.push(listPath)}>
            Back to Holidays
          </Button>
        </div>
      </Card>
    )
  }

  const holidayData = holiday.holiday || holiday
  const today = dayjs()
  const holidayDate = dayjs(holidayData.date)
  const isToday = holidayDate.isSame(today, 'day')
  const isPast = holidayDate.isBefore(today, 'day')
  const daysUntil = holidayDate.diff(today, 'days')

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          {
            title: (
              <span className="flex items-center cursor-pointer" onClick={() => router.push(dashboardPath)}>
                <HomeOutlined className="mr-1" />
                Dashboard
              </span>
            ),
          },
          {
            title: (
              <span className="cursor-pointer" onClick={() => router.push(listPath)}>
                Holidays
              </span>
            ),
          },
          {
            title: 'View Details',
          },
        ]}
      />

      {/* Page Header */}
      <Card>
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-3">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push(listPath)}
            />
            <div>
              <div className="flex items-center space-x-3">
                <Title level={2} className="m-0">
                  {holidayData.name || 'Unnamed Holiday'}
                </Title>
                {isToday && (
                  <Tag color="green" icon={<CheckCircleOutlined />}>
                    Today
                  </Tag>
                )}
                {!isPast && !isToday && (
                  <Tag color="blue">
                    In {daysUntil} {daysUntil === 1 ? 'day' : 'days'}
                  </Tag>
                )}
                {isPast && <Tag color="default">Past</Tag>}
                <Tag color={holidayData.isRecurring ? 'blue' : 'default'}>
                  {holidayData.isRecurring ? 'Recurring' : 'One-time'}
                </Tag>
              </div>
              <Text type="secondary">
                <CalendarOutlined className="mr-2" />
                {holidayDate.format('dddd, MMMM DD, YYYY')}
              </Text>
            </div>
          </div>

          {role === 'admin' && (
            <Space>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => router.push(`${listPath}/${id}/edit`)}
              >
                Edit
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleDelete}
                loading={deleteHolidayMutation.isPending}
              >
                Delete
              </Button>
            </Space>
          )}
        </div>
      </Card>

      {/* Holiday Details */}
      <Card title="Holiday Information">
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Holiday Name">
            {holidayData.name || 'Unnamed Holiday'}
          </Descriptions.Item>

          <Descriptions.Item label="Date">
            <Space>
              <CalendarOutlined />
              {holidayDate.format('dddd, MMMM DD, YYYY')}
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Description">
            <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
              {holidayData.description || 'No description provided'}
            </Paragraph>
          </Descriptions.Item>

          <Descriptions.Item label="Type">
            <Tag color={holidayData.isRecurring ? 'blue' : 'default'}>
              {holidayData.isRecurring ? 'Recurring (Annual)' : 'One-time Event'}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Status">
            {isToday && (
              <Tag color="green" icon={<CheckCircleOutlined />}>
                Today
              </Tag>
            )}
            {!isPast && !isToday && (
              <Tag color="blue">
                Upcoming ({daysUntil} {daysUntil === 1 ? 'day' : 'days'} from now)
              </Tag>
            )}
            {isPast && (
              <Tag color="default">
                Past ({Math.abs(daysUntil)} {Math.abs(daysUntil) === 1 ? 'day' : 'days'} ago)
              </Tag>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Created At">
            {dayjs(holidayData.createdAt).format('MMMM DD, YYYY HH:mm')}
          </Descriptions.Item>

          {holidayData.updatedAt && (
            <Descriptions.Item label="Last Updated">
              {dayjs(holidayData.updatedAt).format('MMMM DD, YYYY HH:mm')}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Additional Information */}
      {holidayData.isRecurring && (
        <Card>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <Text type="secondary">
              <CalendarOutlined className="mr-2" />
              This is a recurring holiday that occurs annually on {holidayDate.format('MMMM DD')}.
            </Text>
          </div>
        </Card>
      )}
    </div>
  )
}
