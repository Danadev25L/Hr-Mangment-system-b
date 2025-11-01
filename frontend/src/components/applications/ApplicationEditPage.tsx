'use client'

import React, { useEffect } from 'react'
import {
  Card,
  Button,
  Form,
  Input,
  message,
  Row,
  Col,
  Breadcrumb,
  Space,
  DatePicker,
  Select,
  Spin,
} from 'antd'
import {
  SaveOutlined,
  ArrowLeftOutlined,
  HomeOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { useRouter, useParams } from 'next/navigation'
import dayjs from 'dayjs'

const { TextArea } = Input

interface ApplicationEditPageProps {
  role: 'admin' | 'manager'
}

export function ApplicationEditPage({ role }: ApplicationEditPageProps) {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const queryClient = useQueryClient()
  const [form] = Form.useForm()

  const basePath = role === 'admin' ? '/admin' : '/manager'
  const listPath = `${basePath}/applications`
  const viewPath = `${basePath}/applications/${id}`
  const dashboardPath = `${basePath}/dashboard`

  // Fetch application data
  const { data: applicationData, isLoading: isLoadingApplication } = useQuery({
    queryKey: ['application', id],
    queryFn: () => apiClient.getApplication(id),
    enabled: !!id,
  })

  // Fetch departments for admin
  const { data: departments, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiClient.getDepartments(),
    enabled: role === 'admin',
  })

  // Set form initial values when data is loaded
  useEffect(() => {
    if (applicationData) {
      form.setFieldsValue({
        title: applicationData.title,
        applicationType: applicationData.applicationType,
        priority: applicationData.priority,
        startDate: dayjs(applicationData.startDate),
        endDate: dayjs(applicationData.endDate),
        reason: applicationData.reason,
        departmentId: applicationData.departmentId === null ? 0 : applicationData.departmentId,
      })
    }
  }, [applicationData, form])

  // Update application mutation
  const updateApplicationMutation = useMutation({
    mutationFn: (values: any) => apiClient.updateApplication(id, values),
    onSuccess: () => {
      message.success('Application updated successfully')
      queryClient.invalidateQueries({ queryKey: ['application', id] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      router.push(viewPath)
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to update application')
    },
  })

  const handleSubmit = async (values: any) => {
    const payload = {
      ...values,
      startDate: values.startDate.format('YYYY-MM-DD'),
      endDate: values.endDate.format('YYYY-MM-DD'),
      departmentId: values.departmentId === 0 ? null : values.departmentId,
    }
    updateApplicationMutation.mutate(payload)
  }

  if (isLoadingApplication) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    )
  }

  if (!applicationData) {
    return <div className="text-center text-gray-500">Application not found</div>
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
                Applications
              </span>
            ),
          },
          {
            title: (
              <span className="cursor-pointer" onClick={() => router.push(viewPath)}>
                View Details
              </span>
            ),
          },
          {
            title: 'Edit',
          },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Edit Application
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Update application information
          </p>
        </div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push(viewPath)}>
          Back to View
        </Button>
      </div>

      {/* Form */}
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="title"
                label="Title"
                rules={[
                  { required: true, message: 'Please enter application title' },
                  { max: 200, message: 'Title cannot exceed 200 characters' },
                ]}
              >
                <Input placeholder="e.g., Annual Leave Request" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="applicationType"
                label="Application Type"
                rules={[{ required: true, message: 'Please select application type' }]}
              >
                <Select placeholder="Select type">
                  <Select.Option value="leave">Leave</Select.Option>
                  <Select.Option value="overtime">Overtime</Select.Option>
                  <Select.Option value="remote">Remote Work</Select.Option>
                  <Select.Option value="other">Other</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="priority"
                label="Priority"
                rules={[{ required: true, message: 'Please select priority' }]}
              >
                <Select placeholder="Select priority">
                  <Select.Option value="low">Low</Select.Option>
                  <Select.Option value="medium">Medium</Select.Option>
                  <Select.Option value="high">High</Select.Option>
                  <Select.Option value="urgent">Urgent</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            {role === 'admin' && (
              <Col xs={24} md={12}>
                <Form.Item
                  name="departmentId"
                  label="User's Department"
                  tooltip="Department is automatically determined from the user who created this application"
                >
                  <Select
                    placeholder="Select department"
                    loading={isLoadingDepartments}
                    disabled
                  >
                    {(Array.isArray(departments) ? departments : (departments as any)?.data || [])?.map((dept: any) => (
                      <Select.Option key={dept.id} value={dept.id}>
                        {dept.departmentName || dept.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            )}
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="startDate"
                label="Start Date"
                rules={[{ required: true, message: 'Please select start date' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="endDate"
                label="End Date"
                rules={[
                  { required: true, message: 'Please select end date' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || !getFieldValue('startDate') || value >= getFieldValue('startDate')) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('End date must be after or equal to start date'))
                    },
                  }),
                ]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="reason"
            label="Reason"
            rules={[
              { required: true, message: 'Please enter a reason' },
              { max: 500, message: 'Reason cannot exceed 500 characters' },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Please provide details about your application..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={updateApplicationMutation.isPending}
              >
                Update Application
              </Button>
              <Button onClick={() => router.push(viewPath)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
