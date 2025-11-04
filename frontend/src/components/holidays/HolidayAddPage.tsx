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
  Tag,
  Divider,
  Typography,
  Row,
  Col,
} from 'antd'
import {
  HomeOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  FileTextOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  GiftOutlined,
  StarOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Title } = Typography

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
              <span className="flex items-center cursor-pointer hover:text-green-600 transition-colors" onClick={() => router.push(dashboardPath)}>
                <HomeOutlined className="mr-1" />
                Dashboard
              </span>
            ),
          },
          {
            title: (
              <span className="flex items-center cursor-pointer hover:text-green-600 transition-colors" onClick={() => router.push(listPath)}>
                <CalendarOutlined className="mr-1" />
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
      <Card className="shadow-lg">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 -m-6 mb-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <CalendarOutlined className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white m-0">Add New Holiday</h1>
                <p className="text-white/80 mt-1 mb-0">Create a new company holiday or observance</p>
              </div>
            </div>
            <Button
              size="large"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push(listPath)}
              className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
            >
              Back
            </Button>
          </div>
        </div>
      </Card>

      {/* Form Card */}
      <Card className="shadow-lg">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            isRecurring: false,
          }}
        >
          <Divider orientation="left">
            <Space>
              <CalendarOutlined className="text-green-600" />
              <span className="text-gray-700 dark:text-gray-300 font-semibold">Holiday Information</span>
            </Space>
          </Divider>

          <Row gutter={[24, 16]}>
            <Col xs={24} md={16}>
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
                  placeholder="e.g., Christmas Day, Independence Day, New Year"
                  prefix={<GiftOutlined className="text-gray-400" />}
                  size="large"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              {/* Date */}
              <Form.Item
                name="date"
                label="Holiday Date"
                rules={[{ required: true, message: 'Please select a date' }]}
                tooltip="Select the date when this holiday will be observed"
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
              <span className="text-gray-700 dark:text-gray-300 font-semibold">Additional Details</span>
            </Space>
          </Divider>

          {/* Description */}
          <Form.Item
            name="description"
            label={
              <span className="flex items-center gap-2">
                Description
                <Tag color="default">Optional</Tag>
              </span>
            }
            rules={[
              { max: 1000, message: 'Description cannot exceed 1000 characters' },
            ]}
          >
            <TextArea
              rows={5}
              placeholder="Enter holiday description, significance, or any additional information... (Optional)"
              showCount
              maxLength={1000}
            />
          </Form.Item>

          {/* Recurring Toggle */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-500">
            <Form.Item
              name="isRecurring"
              label="Recurring Holiday"
              valuePropName="checked"
              tooltip="Enable if this holiday occurs every year (e.g., New Year's Day, Christmas)"
              className="mb-0"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    Is this an annual recurring holiday?
                  </p>
                  <Space className="flex-wrap">
                    <Tag icon={<CheckCircleOutlined />} color="success">
                      Annual (e.g., Christmas, New Year)
                    </Tag>
                    <Tag icon={<CloseCircleOutlined />} color="default">
                      One-time Only
                    </Tag>
                  </Space>
                </div>
                <Switch
                  checkedChildren={<Space><ReloadOutlined />Yes, Annual</Space>}
                  unCheckedChildren="One-time"
                  size="default"
                />
              </div>
            </Form.Item>
          </Card>

          <Divider />

          {/* Form Actions */}
          <Form.Item className="mb-0">
            <Space size="middle">
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={createHolidayMutation.isPending}
                size="large"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 shadow-lg"
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
