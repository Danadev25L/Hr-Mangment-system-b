'use client'

import React from 'react'
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
} from 'antd'
import {
  HomeOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'

const { TextArea } = Input

export function HolidayAddPage() {
  const [form] = Form.useForm()
  const router = useRouter()
  const queryClient = useQueryClient()

  const basePath = '/admin'
  const dashboardPath = `${basePath}/dashboard`
  const listPath = `${basePath}/holidays`

  // Create holiday mutation
  const createHolidayMutation = useMutation({
    mutationFn: (data: any) => apiClient.createHoliday(data),
    onSuccess: () => {
      message.success('Holiday created successfully')
      queryClient.invalidateQueries({ queryKey: ['holidays'] })
      router.push(listPath)
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to create holiday')
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
            title: 'Add Holiday',
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
          <h1 className="text-2xl font-semibold m-0">Add New Holiday</h1>
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
              disabledDate={(current) => {
                // Optional: disable past dates
                // return current && current < dayjs().startOf('day')
                return false
              }}
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
                loading={createHolidayMutation.isPending}
                size="large"
              >
                Create Holiday
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
