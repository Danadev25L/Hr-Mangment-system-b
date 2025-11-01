'use client'

import React, { useState, useMemo } from 'react'
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
} from 'antd'
import {
  PlusOutlined,
  ArrowLeftOutlined,
  HomeOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { useRouter } from 'next/navigation'

const { TextArea } = Input

interface ApplicationAddPageProps {
  role: 'admin' | 'manager'
}

export function ApplicationAddPage({ role }: ApplicationAddPageProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null)

  const basePath = role === 'admin' ? '/admin' : '/manager'
  const listPath = `${basePath}/applications`
  const dashboardPath = `${basePath}/dashboard`

  // Fetch departments (for admin to select department, for manager to get their own department)
  const { data: departments, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiClient.getDepartments(),
  })

  // Fetch users for application selection (manager gets department users including themselves)
  const { data: usersForApplications, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users-for-applications', role],
    queryFn: () => apiClient.getUsersForApplications(),
  })

  // Filter users by selected department (for admin) or show all (for manager - already filtered)
  const filteredUsers = useMemo(() => {
    if (!usersForApplications) return []
    const usersList = Array.isArray(usersForApplications) 
      ? usersForApplications 
      : usersForApplications?.data || []
    
    if (role === 'admin') {
      // Admin: filter by selected department
      if (!selectedDepartment) return []
      return usersList.filter((user: any) => user.departmentId === selectedDepartment)
    } else {
      // Manager: users are already filtered by backend (department + manager)
      return usersList
    }
  }, [usersForApplications, selectedDepartment, role])

  // Create application mutation
  const createApplicationMutation = useMutation({
    mutationFn: (values: any) => apiClient.createApplication(values),
    onSuccess: () => {
      message.success('Application created successfully')
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      router.push(listPath)
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to create application')
    },
  })

  const handleSubmit = async (values: any) => {
    const payload = {
      ...values,
      startDate: values.startDate.format('YYYY-MM-DD'),
      endDate: values.endDate.format('YYYY-MM-DD'),
      departmentId: values.departmentId === 0 ? null : values.departmentId,
    }
    createApplicationMutation.mutate(payload)
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
            title: 'Add New',
          },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Create New Application
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Submit a new application request
          </p>
        </div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push(listPath)}>
          Back to List
        </Button>
      </div>

      {/* Form */}
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          initialValues={{
            priority: 'medium',
            applicationType: 'leave',
          }}
        >
          {role === 'admin' && (
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="departmentFilter"
                  label="Department"
                  rules={[{ required: true, message: 'Please select a department first' }]}
                >
                  <Select
                    placeholder="Select department"
                    loading={isLoadingDepartments}
                    onChange={(value) => {
                      setSelectedDepartment(value)
                      // Clear user selection when department changes
                      form.setFieldsValue({ userId: undefined })
                    }}
                  >
                    {(Array.isArray(departments) ? departments : (departments as any)?.data || [])?.map((dept: any) => (
                      <Select.Option key={dept.id} value={dept.id}>
                        {dept.departmentName || dept.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="userId"
                  label="Employee"
                  rules={[{ required: true, message: 'Please select an employee' }]}
                >
                  <Select
                    placeholder={selectedDepartment ? "Select employee from department" : "Select department first"}
                    loading={isLoadingUsers}
                    disabled={!selectedDepartment}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children as unknown as string)
                        ?.toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  >
                    {filteredUsers.map((user: any) => (
                      <Select.Option key={user.id} value={user.id}>
                        {user.fullName || user.name} - {user.employeeCode || user.email}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}

          {role === 'manager' && (
            <Row gutter={16}>
              <Col xs={24}>
                <Form.Item
                  name="userId"
                  label="Create Application For"
                  rules={[{ required: true, message: 'Please select who this application is for' }]}
                  tooltip="You can create an application for yourself or for any employee in your department"
                >
                  <Select
                    placeholder="Select yourself or an employee from your department"
                    loading={isLoadingUsers}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children as unknown as string)
                        ?.toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  >
                    {filteredUsers.map((user: any) => (
                      <Select.Option key={user.id} value={user.id}>
                        {user.fullName || user.name} ({user.employeeCode || user.email})
                        {user.role === 'ROLE_MANAGER' ? ' - You' : ''}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}

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
                icon={<PlusOutlined />}
                loading={createApplicationMutation.isPending}
              >
                Create Application
              </Button>
              <Button onClick={() => router.push(listPath)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
