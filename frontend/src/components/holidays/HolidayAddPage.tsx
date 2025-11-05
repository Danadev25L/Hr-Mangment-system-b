'use client'

import React from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  Form,
  Input,
  DatePicker,
  Switch,
  Space,
  message,
  Tag,
  Divider,
  Row,
  Col,
} from 'antd'
import {
  SaveOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  FileTextOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  GiftOutlined,
} from '@ant-design/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import dayjs from 'dayjs'
import { PageHeader, EnhancedButton, EnhancedCard } from '@/components/ui'
import { HolidaysIllustration } from '@/components/ui/illustrations/HolidaysIllustration'

const { TextArea } = Input

interface HolidayAddPageProps {
  role: 'admin' | 'manager' | 'employee'
  title: string
  description: string
}

export function HolidayAddPage({ role, title, description }: HolidayAddPageProps) {
  const locale = useLocale()
  const t = useTranslations()
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const basePath = role === 'admin' ? '/admin/holidays' : role === 'manager' ? '/manager/holidays' : '/employee/holidays'
  const listPath = `/${locale}${basePath}`

  const handleNavigation = (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path
    }
  }

  // Create holiday mutation
  const createHolidayMutation = useMutation({
    mutationFn: (data: any) => apiClient.createHoliday(data),
    onSuccess: () => {
      message.success(t('holidays.createSuccess'))
      queryClient.invalidateQueries({ queryKey: ['holidays'] })
      handleNavigation(listPath)
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || t('holidays.createError'))
    },
  })

  const handleSubmit = (values: any) => {
    const payload = {
      date: values.date.format('YYYY-MM-DD'),
      name: values.name,
      description: values.description || '',
      isRecurring: values.isRecurring || false,
    }

    createHolidayMutation.mutate(payload)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        icon={<HolidaysIllustration className="w-20 h-20" />}
        gradient="green"
        action={
          <EnhancedButton
            variant="secondary"
            icon={<ArrowLeftOutlined />}
            onClick={() => handleNavigation(listPath)}
          >
            {t('common.back')}
          </EnhancedButton>
        }
      />

      <EnhancedCard>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            date: dayjs(),
            isRecurring: false,
          }}
        >
          <Divider orientation="left">
            <Space>
              <CalendarOutlined className="text-green-600" />
              <span className="text-gray-700 dark:text-gray-300 font-semibold">
                {t('holidays.holidayInformation')}
              </span>
            </Space>
          </Divider>

          <Row gutter={[24, 16]}>
            <Col xs={24} md={16}>
              <Form.Item
                name="name"
                label={t('holidays.holidayName')}
                rules={[
                  { required: true, message: t('holidays.nameRequired') },
                  { max: 255, message: t('holidays.nameMaxLength') },
                ]}
              >
                <Input
                  placeholder={t('holidays.namePlaceholder')}
                  prefix={<GiftOutlined className="text-gray-400" />}
                  size="large"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="date"
                label={t('holidays.date')}
                rules={[{ required: true, message: t('holidays.dateRequired') }]}
                tooltip={t('holidays.dateTooltip')}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">
            <Space>
              <FileTextOutlined className="text-green-600" />
              <span className="text-gray-700 dark:text-gray-300 font-semibold">
                {t('holidays.additionalDetails')}
              </span>
            </Space>
          </Divider>

          <Form.Item
            name="description"
            label={
              <span className="flex items-center gap-2">
                {t('holidays.description')}
                <Tag color="default">{t('common.optional')}</Tag>
              </span>
            }
            rules={[
              { max: 1000, message: t('holidays.descriptionMaxLength') },
            ]}
          >
            <TextArea
              rows={5}
              placeholder={t('holidays.descriptionPlaceholder')}
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <EnhancedCard className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-gray-800 border-l-4 border-l-green-500">
            <Form.Item
              name="isRecurring"
              label={t('holidays.recurringHoliday')}
              valuePropName="checked"
              tooltip={t('holidays.recurringTooltip')}
              className="mb-0"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    {t('holidays.recurringQuestion')}
                  </p>
                  <Space className="flex-wrap">
                    <Tag icon={<CheckCircleOutlined />} color="success">
                      {t('holidays.annual')}
                    </Tag>
                    <Tag icon={<CloseCircleOutlined />} color="default">
                      {t('holidays.oneTime')}
                    </Tag>
                  </Space>
                </div>
                <Switch
                  checkedChildren={<Space><ReloadOutlined />{t('holidays.yesAnnual')}</Space>}
                  unCheckedChildren={t('holidays.oneTime')}
                  size="default"
                />
              </div>
            </Form.Item>
          </EnhancedCard>

          <Divider />

          <Form.Item className="mb-0">
            <Space size="middle">
              <EnhancedButton
                variant="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={createHolidayMutation.isPending}
              >
                {t('holidays.createHoliday')}
              </EnhancedButton>
              <EnhancedButton
                variant="ghost"
                onClick={() => handleNavigation(listPath)}
              >
                {t('common.cancel')}
              </EnhancedButton>
            </Space>
          </Form.Item>
        </Form>
      </EnhancedCard>
    </div>
  )
}
