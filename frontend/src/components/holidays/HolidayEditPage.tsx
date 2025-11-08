'use client'

import React, { useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  DatePicker,
  Space,
  Breadcrumb,
  message,
  Empty,
} from 'antd'
import {
  HomeOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { useTranslations, useLocale } from 'next-intl'
import dayjs from 'dayjs'
import { CustomSpinner } from '@/components/ui'

const { TextArea } = Input

interface HolidayEditPageProps {
  id: string
}

export function HolidayEditPage({ id }: HolidayEditPageProps) {
  const [form] = Form.useForm()
  const locale = useLocale()
  const t = useTranslations()
  const queryClient = useQueryClient()

  const basePath = '/admin'
  const dashboardPath = `/${locale}${basePath}/dashboard`
  const listPath = `/${locale}${basePath}/holidays`

  // Navigate with locale support
  const handleNavigation = (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path
    }
  }

  // Fetch holiday details
  const { data: holiday, isLoading: holidayLoading } = useQuery({
    queryKey: ['holiday', id],
    queryFn: () => apiClient.getHoliday(parseInt(id)),
  })

  // Update holiday mutation
  const updateHolidayMutation = useMutation({
    mutationFn: (data: any) => apiClient.updateHoliday(parseInt(id), data),
    onSuccess: () => {
      message.success('Holiday updated successfully')
      queryClient.invalidateQueries({ queryKey: ['holidays'] })
      queryClient.invalidateQueries({ queryKey: ['holiday', id] })
      handleNavigation(listPath)
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to update holiday')
    },
  })

  // Set form initial values when holiday is loaded
  useEffect(() => {
    if (holiday) {
      const holidayData = holiday.holiday || holiday

      form.setFieldsValue({
        name: holidayData.name,
        date: holidayData.date ? dayjs(holidayData.date) : null,
        description: holidayData.description,
      })
    }
  }, [holiday, form])

  const handleSubmit = (values: any) => {
    // For all holidays, use the exact date
    const dateToSave = values.date.format('YYYY-MM-DD');
    
    const payload = {
      date: dateToSave,
      name: values.name,
      description: values.description || '',
      isRecurring: false, // Always false now
    };

    console.log('Updating holiday payload:', payload);
    updateHolidayMutation.mutate(payload);
  }

  if (holidayLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <CustomSpinner size="large" text="Loading holiday..." />
      </div>
    )
  }

  if (!holiday) {
    return (
      <Card>
        <Empty description="Holiday not found" />
        <div className="text-center mt-4">
          <Button onClick={() => handleNavigation(listPath)}>
            Back to Holidays
          </Button>
        </div>
      </Card>
    )
  }

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
            title: t('holidays.form.editHoliday'),
          },
        ]}
      />

      {/* Page Header */}
      <Card className="shadow-lg">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 -m-6 mb-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <CalendarOutlined className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white m-0">{t('holidays.form.editHoliday')}</h1>
                <p className="text-white/80 mt-1 mb-0">{t('holidays.form.updateHolidayInfo')}</p>
              </div>
            </div>
            <Button
              size="large"
              icon={<ArrowLeftOutlined />}
              onClick={() => handleNavigation(listPath)}
              className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
            >
              Back
            </Button>
          </div>
        </div>
      </Card>

      {/* Form Card */}
      <Card className="shadow-md">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {/* Holiday Name */}
          <Form.Item
            name="name"
            label="Holiday Name"
            rules={[
              { required: true, message: t('holidays.form.pleaseEnterName') },
              { max: 255, message: t('holidays.form.nameMaxLength') },
            ]}
          >
            <Input
              placeholder="e.g., Christmas Day, Independence Day"
              prefix={<CalendarOutlined />}
              size="large"
            />
          </Form.Item>

          {/* Date */}
          <Form.Item
            name="date"
            label="Holiday Date"
            rules={[{ required: true, message: t('holidays.form.pleaseSelectDate') }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              size="large"
              placeholder="Select date"
            />
          </Form.Item>

          {/* Description */}
          <Form.Item
            name="description"
            label="Description (Optional)"
            rules={[
              { max: 1000, message: t('holidays.form.descriptionMaxLength') },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Enter holiday description or any additional information..."
              showCount
              maxLength={1000}
            />
          </Form.Item>

          {/* Form Actions */}
          <Form.Item className="mb-0">
            <Space size="middle">
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={updateHolidayMutation.isPending}
                size="large"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 shadow-lg"
              >
                Update Holiday
              </Button>
              <Button
                onClick={() => handleNavigation(listPath)}
                size="large"
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
