'use client'

import React from 'react'
import {
  Card,
  Button,
  Space,
  Tag,
  Breadcrumb,
  message,
  Empty,
  Descriptions,
  Typography,
  Row,
  Col,
} from 'antd'
import {
  ArrowLeftOutlined,
  HomeOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  GiftOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { useTranslations, useLocale } from 'next-intl'
import dayjs from 'dayjs'
import { CustomSpinner } from '@/components/ui'

const { Title, Paragraph, Text } = Typography

interface HolidayViewPageProps {
  role: 'admin' | 'manager' | 'employee'
  id: string
}

export function HolidayViewPage({ role, id }: HolidayViewPageProps) {
  const locale = useLocale()
  const t = useTranslations()
  const queryClient = useQueryClient()

  const basePath = role === 'admin' ? '/admin' : role === 'manager' ? '/manager' : '/employee'
  const listPath = `/${locale}${basePath}/holidays`
  const dashboardPath = `/${locale}${basePath}/dashboard`

  // Navigate with locale support
  const handleNavigation = (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path
    }
  }

  // Fetch holiday details
  const { data: holiday, isLoading } = useQuery({
    queryKey: ['holiday', id],
    queryFn: () => apiClient.getHoliday(parseInt(id)),
  })

  // {t('holidays.deleteHoliday')} mutation (admin only)
  const deleteHolidayMutation = useMutation({
    mutationFn: (holidayId: number) => apiClient.deleteHoliday(holidayId),
    onSuccess: () => {
      message.success(t('holidays.deleteSuccess'))
      handleNavigation(listPath)
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || t('holidays.deleteError'))
    },
  })

  const handleDelete = () => {
    if (window.confirm(t('holidays.deleteConfirm', { name: holidayData.name }))) {
      deleteHolidayMutation.mutate(parseInt(id))
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <CustomSpinner size="large" text="Loading holiday details..." />
      </div>
    )
  }

  if (!holiday) {
    return (
      <Card>
        <Empty description="Holiday not found" />
        <div className="text-center mt-4">
          <Button onClick={() => handleNavigation(listPath)}>
            {t('common.back')} to Holidays
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
              <span className="flex items-center cursor-pointer hover:text-green-600 transition-colors" onClick={() => handleNavigation(dashboardPath)}>
                <HomeOutlined className="mr-1" />
                Dashboard
              </span>
            ),
          },
          {
            title: (
              <span className="flex items-center cursor-pointer hover:text-green-600 transition-colors" onClick={() => handleNavigation(listPath)}>
                <CalendarOutlined className="mr-1" />
                Holidays
              </span>
            ),
          },
          {
            title: t('holidays.viewDetails'),
          },
        ]}
      />

      {/* Page Header */}
      <Card className="shadow-lg">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 -m-6 mb-6 rounded-t-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <CalendarOutlined className="text-white text-3xl" />
              </div>
              <div>
                <Title level={2} className="!text-white !mb-2">
                  {holidayData.name || t('holidays.view.unnamedHoliday')}
                </Title>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="text-white/90 text-base flex items-center gap-2">
                    <CalendarOutlined />
                    {holidayDate.format('dddd, MMMM DD, YYYY')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isToday && (
                    <Tag color="green" icon={<CheckCircleOutlined />} className="border-0">
                      Today
                    </Tag>
                  )}
                  {!isPast && !isToday && (
                    <Tag color="blue" icon={<ClockCircleOutlined />} className="border-0">
                      {daysUntil === 1 ? t('holidays.view.inDays', { count: 1, unit: t('holidays.day') }) : t('holidays.view.inDays', { count: daysUntil, unit: t('holidays.days') })}
                    </Tag>
                  )}
                  {isPast && (
                    <Tag color="default" className="border-0">
                      {t('holidays.past')}
                    </Tag>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="large"
                icon={<ArrowLeftOutlined />}
                onClick={() => handleNavigation(listPath)}
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
              >
                {t('common.back')}
              </Button>
              {role === 'admin' && (
                <>
                  <Button
                    type="primary"
                    size="large"
                    icon={<EditOutlined />}
                    onClick={() => handleNavigation(`${listPath}/${id}/edit`)}
                    className="bg-white text-green-600 border-0 hover:bg-white/90"
                  >
                    {t('holidays.editHoliday')}
                  </Button>
                  <Button
                    danger
                    size="large"
                    icon={<DeleteOutlined />}
                    onClick={handleDelete}
                    loading={deleteHolidayMutation.isPending}
                  >
                    {t('holidays.deleteHoliday')}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Holiday Details */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card className="shadow-md">
            <Title level={4} className="mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <CalendarOutlined className="text-white" />
              </div>
              Holiday Information
            </Title>
            <Descriptions
              bordered
              column={1}
              size="middle"
              labelStyle={{ 
                fontWeight: 600, 
                backgroundColor: '#f9fafb',
                width: '200px'
              }}
              contentStyle={{ backgroundColor: 'white' }}
            >
              <Descriptions.Item label={t('holidays.holidayName')}>
                <Text strong className="text-base">{holidayData.name || t('holidays.view.unnamedHoliday')}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('holidays.date')}>
                <Space>
                  <CalendarOutlined className="text-green-600" />
                  <Text className="text-base">{holidayDate.format('dddd, MMMM DD, YYYY')}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label={t('holidays.status')}>
                <Space wrap>
                  {isToday && (
                    <Tag color="green" icon={<CheckCircleOutlined />} className="text-sm">
                      Today
                    </Tag>
                  )}
                  {!isPast && !isToday && (
                    <Tag color="blue" icon={<ClockCircleOutlined />} className="text-sm">
                      Upcoming - {daysUntil === 1 ? t('holidays.view.inDays', { count: 1, unit: t('holidays.day') }) : t('holidays.view.inDays', { count: daysUntil, unit: t('holidays.days') })}
                    </Tag>
                  )}
                  {isPast && (
                    <Tag color="default" className="text-sm">
                      {t('holidays.view.pastDaysAgo', { count: Math.abs(daysUntil), unit: Math.abs(daysUntil) === 1 ? t('holidays.day') : t('holidays.days') })}
                    </Tag>
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label={t('holidays.description')}>
                <Paragraph className="mb-0 whitespace-pre-wrap">
                  {holidayData.description || <Text type="secondary">{t('holidays.view.noDescription')}</Text>}
                </Paragraph>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card className="shadow-md">
            <Title level={4} className="mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <InfoCircleOutlined className="text-white" />
              </div>
              Additional Details
            </Title>
            <Descriptions
              bordered
              column={1}
              size="middle"
              labelStyle={{ 
                fontWeight: 600, 
                backgroundColor: '#f9fafb'
              }}
              contentStyle={{ backgroundColor: 'white' }}
            >
              <Descriptions.Item label={t('holidays.view.createdAt')}>
                <Text className="text-sm">{dayjs(holidayData.createdAt).format('MMM DD, YYYY HH:mm')}</Text>
              </Descriptions.Item>
              {holidayData.updatedAt && (
                <Descriptions.Item label={t('holidays.view.lastUpdated')}>
                  <Text className="text-sm">{dayjs(holidayData.updatedAt).format('MMM DD, YYYY HH:mm')}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
