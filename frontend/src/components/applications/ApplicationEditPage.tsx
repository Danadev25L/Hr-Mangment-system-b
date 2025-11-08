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
  EditOutlined,
  FileTextOutlined,
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
      message.success({
        content: (
          <div>
            <div className="font-semibold">✅ Application Updated</div>
            <div className="text-xs mt-1">Changes have been saved successfully</div>
          </div>
        ),
        duration: 3,
      })
      queryClient.invalidateQueries({ queryKey: ['application', id] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      setTimeout(() => router.push(viewPath), 1000)
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to update application'
      
      if (errorMessage.includes('End date must be after start date') || 
          errorMessage.includes('endDate') || 
          errorMessage.includes('startDate')) {
        message.error({
          content: (
            <div>
              <div className="font-semibold">📅 Invalid Date Range</div>
              <div>End date must be after or equal to start date</div>
              <div className="text-xs mt-1">Please check your date selection</div>
            </div>
          ),
          duration: 5,
        })
      } else if (errorMessage.includes('only update pending applications') || 
                 errorMessage.includes('Cannot update processed application')) {
        message.error({
          content: (
            <div>
              <div className="font-semibold">🚫 Cannot Update Processed Application</div>
              <div>Only pending applications can be edited</div>
              <div className="text-xs mt-1">This application has already been approved or rejected</div>
            </div>
          ),
          duration: 6,
        })
      } else if (errorMessage.includes('not found') || errorMessage.includes('Not found')) {
        message.error({
          content: (
            <div>
              <div className="font-semibold">❌ Application Not Found</div>
              <div>This application may have been deleted</div>
            </div>
          ),
          duration: 4,
        })
      } else if (errorMessage.includes('Forbidden') || errorMessage.includes('permission')) {
        message.error({
          content: (
            <div>
              <div className="font-semibold">🚫 Access Denied</div>
              <div>You don&apos;t have permission to edit this application</div>
            </div>
          ),
          duration: 5,
        })
      } else if (errorMessage.includes('overlapping') || errorMessage.includes('already has')) {
        message.error({
          content: (
            <div>
              <div className="font-semibold">🔄 Conflicting Application</div>
              <div>{errorMessage}</div>
              <div className="text-xs mt-1">Check for overlapping dates with other applications</div>
            </div>
          ),
          duration: 6,
        })
      } else {
        message.error({
          content: (
            <div>
              <div className="font-semibold">❌ Update Failed</div>
              <div>{errorMessage}</div>
            </div>
          ),
          duration: 5,
        })
      }
    },
  })

  const handleSubmit = async (values: any) => {
    try {
      // Validate dates before submission
      const startDate = values.startDate
      const endDate = values.endDate

      if (!startDate || !endDate) {
        message.error({
          content: (
            <div>
              <div className="font-semibold">⚠️ Missing Dates</div>
              <div>Both start date and end date are required</div>
            </div>
          ),
          duration: 4,
        })
        return
      }

      // Check if end date is before start date
      if (endDate.isBefore(startDate, 'day')) {
        message.error({
          content: (
            <div>
              <div className="font-semibold">📅 Invalid Date Range</div>
              <div>End date cannot be before start date</div>
              <div className="text-xs mt-1">
                Start: {startDate.format('MMM DD, YYYY')} | End: {endDate.format('MMM DD, YYYY')}
              </div>
            </div>
          ),
          duration: 5,
        })
        return
      }

      const payload = {
        ...values,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD'),
        departmentId: values.departmentId === 0 ? null : values.departmentId,
      }
      updateApplicationMutation.mutate(payload)
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      message.error('An unexpected error occurred. Please try again.')
    }
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
              <span className="flex items-center cursor-pointer hover:text-blue-600 transition-colors" onClick={() => router.push(dashboardPath)}>
                <HomeOutlined className="mr-1" />
                Dashboard
              </span>
            ),
          },
          {
            title: (
              <span className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => router.push(listPath)}>
                Applications
              </span>
            ),
          },
          {
            title: (
              <span className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => router.push(viewPath)}>
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
      <Card className="shadow-lg border-t-4 border-t-purple-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <EditOutlined className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 m-0">
                Edit Application
              </h1>
              <p className="text-gray-500 dark:text-gray-400 m-0">
                Update application information
              </p>
            </div>
          </div>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.push(viewPath)}
            size="large"
          >
            Back to View
          </Button>
        </div>
      </Card>

      {/* Form */}
      <Card className="shadow-md">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="title"
                label={<span className="font-semibold">Title</span>}
                rules={[
                  { required: true, message: 'Please enter application title' },
                  { max: 200, message: 'Title cannot exceed 200 characters' },
                ]}
              >
                <Input 
                  placeholder="e.g., Annual Leave Request" 
                  size="large"
                  prefix={<FileTextOutlined className="text-gray-400" />}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="applicationType"
                label={<span className="font-semibold">Application Type</span>}
                rules={[{ required: true, message: 'Please select application type' }]}
              >
                <Select placeholder="Select type" size="large">
                  <Select.Option value="leave">Leave</Select.Option>
                  <Select.Option value="overtime">Overtime</Select.Option>
                  <Select.Option value="remote">Remote Work</Select.Option>
                  <Select.Option value="other">Other</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="priority"
                label={<span className="font-semibold">Priority</span>}
                rules={[{ required: true, message: 'Please select priority' }]}
              >
                <Select placeholder="Select priority" size="large">
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
                  label={<span className="font-semibold">User&apos;s Department</span>}
                  tooltip="Department is automatically determined from the user who created this application"
                >
                  <Select
                    placeholder="Select department"
                    loading={isLoadingDepartments}
                    disabled
                    size="large"
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

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="startDate"
                label={<span className="font-semibold">Start Date</span>}
                rules={[{ required: true, message: 'Please select start date' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                  size="large"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="endDate"
                label={<span className="font-semibold">End Date</span>}
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
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="reason"
            label={<span className="font-semibold">Reason</span>}
            rules={[
              { required: true, message: 'Please enter a reason' },
              { max: 500, message: 'Reason cannot exceed 500 characters' },
            ]}
          >
            <TextArea
              rows={5}
              placeholder="Please provide details about your application..."
              showCount
              maxLength={500}
              size="large"
            />
          </Form.Item>

          <Form.Item className="mb-0 pt-4 border-t">
            <div className="flex justify-end gap-3">
              <Button 
                onClick={() => router.push(viewPath)}
                size="large"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={updateApplicationMutation.isPending}
                size="large"
                className="bg-gradient-to-r from-purple-500 to-indigo-600 border-none hover:from-purple-600 hover:to-indigo-700"
              >
                Update Application
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
