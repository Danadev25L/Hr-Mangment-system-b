'use client'

import React, { useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  DatePicker,
  Switch,
  Space,
  Breadcrumb,
  message,
  Spin,
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
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'

const { TextArea } = Input

interface HolidayEditPageProps {
  id: string
}

export function HolidayEditPage({ id }: HolidayEditPageProps) {
  const [form] = Form.useForm()
  const router = useRouter()
  const queryClient = useQueryClient()

  const basePath = '/admin'
  const dashboardPath = `${basePath}/dashboard`
  const listPath = `${basePath}/holidays`

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
      router.push(listPath)
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
        isRecurring: holidayData.isRecurring || false,
      })
    }
  }, [holiday, form])

  const handleSubmit = (values: any) => {
    const payload = {
      date: values.date.format('YYYY-MM-DD'),
      name: values.name,
      description: values.description || '',
      isRecurring: values.isRecurring || false,
    }

    updateHolidayMutation.mutate(payload)
  }

  if (holidayLoading) {
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
            title: 'Edit Holiday',
          },
        ]}
      />

      {/* Page Header */}
      <Card>
        <div className="flex items-center space-x-3">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push(listPath)}
          />
          <h1 className="text-2xl font-semibold m-0">Edit Holiday</h1>
        </div>
      </Card>

      {/* Form Card */}
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            isRecurring: false,
          }}
        >
          {/* Holiday Name */}
          <Form.Item
            name="name"
            label="Holiday Name"
            rules={[
              { required: true, message: 'Please enter holiday name' },
              { max: 255, message: 'Name cannot exceed 255 characters' },
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
            rules={[{ required: true, message: 'Please select a date' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              size="large"
            />
          </Form.Item>

          {/* Description */}
          <Form.Item
            name="description"
            label="Description (Optional)"
            rules={[
              { max: 1000, message: 'Description cannot exceed 1000 characters' },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Enter holiday description or any additional information..."
              showCount
              maxLength={1000}
            />
          </Form.Item>

          {/* Recurring Toggle */}
          <Form.Item
            name="isRecurring"
            label="Recurring Holiday"
            valuePropName="checked"
            tooltip="Enable if this holiday occurs every year (e.g., New Year's Day, Christmas)"
          >
            <Switch
              checkedChildren="Yes, Annual"
              unCheckedChildren="One-time"
            />
          </Form.Item>

          {/* Form Actions */}
          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={updateHolidayMutation.isPending}
                size="large"
              >
                Update Holiday
              </Button>
              <Button
                onClick={() => router.push(listPath)}
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
