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
  Tag,
  Divider,
  Typography,
  Alert,
} from 'antd'
import {
  PlusOutlined,
  ArrowLeftOutlined,
  HomeOutlined,
  FileTextOutlined,
  UserOutlined,
  TeamOutlined,
  BankOutlined,
  CalendarOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { useRouter } from 'next/navigation'

const { TextArea } = Input
const { Title } = Typography

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
              <span className="flex items-center cursor-pointer hover:text-blue-600 transition-colors" onClick={() => router.push(dashboardPath)}>
                <HomeOutlined className="mr-1" />
                Dashboard
              </span>
            ),
          },
          {
            title: (
              <span className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => router.push(listPath)}>
                <FileTextOutlined className="mr-1" />
                Applications
              </span>
            ),
          },
          {
            title: (
              <span className="flex items-center">
                <PlusOutlined className="mr-1" />
                Add New
              </span>
            ),
          },
        ]}
      />

      {/* Header */}
      <Card className="shadow-lg border-t-4 border-t-cyan-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileTextOutlined className="text-white text-2xl" />
            </div>
            <div>
              <Title level={2} className="!mb-1 !text-gray-900 dark:!text-gray-100">
                Create New Application
              </Title>
              <p className="text-gray-500 dark:text-gray-400 m-0 flex items-center gap-2">
                <InfoCircleOutlined />
                Submit a new application request for approval
              </p>
            </div>
          </div>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.push(listPath)}
            size="large"
            className="rounded-lg"
          >
            Back to List
          </Button>
        </div>
      </Card>

      {/* Form */}
      <Card className="shadow-lg">
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
            <Card className="mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700 border-l-4 border-l-blue-500">
              <Divider orientation="left">
                <Space>
                  <TeamOutlined className="text-blue-600" />
                  <span className="text-gray-700 dark:text-gray-300 font-semibold">Select Employee</span>
                </Space>
              </Divider>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="departmentFilter"
                    label={
                      <span className="flex items-center gap-2 font-medium">
                        <BankOutlined className="text-blue-600" />
                        Department
                      </span>
                    }
                    rules={[{ required: true, message: 'Please select a department first' }]}
                  >
                    <Select
                      placeholder="Select department first"
                      loading={isLoadingDepartments}
                      size="large"
                      className="rounded-lg"
                      suffixIcon={<BankOutlined className="text-gray-400" />}
                      onChange={(value) => {
                        setSelectedDepartment(value)
                        form.setFieldsValue({ userId: undefined })
                      }}
                    >
                      {(Array.isArray(departments) ? departments : (departments as any)?.data || [])?.map((dept: any) => (
                        <Select.Option key={dept.id} value={dept.id}>
                          <Space>
                            <BankOutlined />
                            {dept.departmentName || dept.name}
                          </Space>
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="userId"
                    label={
                      <span className="flex items-center gap-2 font-medium">
                        <UserOutlined className="text-blue-600" />
                        Employee
                      </span>
                    }
                    rules={[{ required: true, message: 'Please select an employee' }]}
                  >
                    <Select
                      placeholder={selectedDepartment ? "Select employee from department" : "Select department first"}
                      loading={isLoadingUsers}
                      disabled={!selectedDepartment}
                      showSearch
                      size="large"
                      className="rounded-lg"
                      suffixIcon={<UserOutlined className="text-gray-400" />}
                      filterOption={(input, option) =>
                        (option?.children as unknown as string)
                          ?.toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    >
                      {filteredUsers.map((user: any) => (
                        <Select.Option key={user.id} value={user.id}>
                          <Space>
                            <UserOutlined />
                            {user.fullName || user.name} - {user.employeeCode || user.email}
                          </Space>
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          )}

          {role === 'manager' && (
            <Card className="mb-6 bg-gradient-to-r from-green-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 border-l-4 border-l-green-500">
              <Alert
                message="Application Creation"
                description="You can create an application for yourself or for any employee in your department"
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
                className="mb-4"
              />
              <Row gutter={16}>
                <Col xs={24}>
                  <Form.Item
                    name="userId"
                    label={
                      <span className="flex items-center gap-2 font-medium">
                        <TeamOutlined className="text-green-600" />
                        Create Application For
                      </span>
                    }
                    rules={[{ required: true, message: 'Please select who this application is for' }]}
                    tooltip="Select yourself or an employee from your department"
                  >
                    <Select
                      placeholder="Select yourself or an employee from your department"
                      loading={isLoadingUsers}
                      showSearch
                      size="large"
                      className="rounded-lg"
                      suffixIcon={<UserOutlined className="text-gray-400" />}
                      filterOption={(input, option) =>
                        (option?.children as unknown as string)
                          ?.toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    >
                      {filteredUsers.map((user: any) => (
                        <Select.Option key={user.id} value={user.id}>
                          <Space>
                            {user.role === 'ROLE_MANAGER' ? <SafetyCertificateOutlined className="text-blue-500" /> : <UserOutlined />}
                            {user.fullName || user.name} ({user.employeeCode || user.email})
                            {user.role === 'ROLE_MANAGER' && <Tag color="blue">You</Tag>}
                          </Space>
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          )}

          <Divider orientation="left">
            <Space>
              <FileTextOutlined className="text-cyan-600" />
              <span className="text-gray-700 dark:text-gray-300 font-semibold">Application Details</span>
            </Space>
          </Divider>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="title"
                label={
                  <span className="flex items-center gap-2 font-medium">
                    <FileTextOutlined className="text-cyan-600" />
                    Application Title
                  </span>
                }
                rules={[
                  { required: true, message: 'Please enter application title' },
                  { max: 200, message: 'Title cannot exceed 200 characters' },
                ]}
              >
                <Input 
                  placeholder="e.g., Annual Leave Request, Sick Leave" 
                  size="large"
                  className="rounded-lg"
                  prefix={<FileTextOutlined className="text-gray-400" />}
                  suffix={<Tag color="blue">Max 200 chars</Tag>}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="applicationType"
                label={
                  <span className="flex items-center gap-2 font-medium">
                    <CheckCircleOutlined className="text-cyan-600" />
                    Application Type
                  </span>
                }
                rules={[{ required: true, message: 'Please select application type' }]}
              >
                <Select 
                  placeholder="Select type" 
                  size="large"
                  className="rounded-lg"
                >
                  <Select.Option value="leave">
                    <Space>
                      <CalendarOutlined className="text-blue-500" />
                      Leave
                    </Space>
                  </Select.Option>
                  <Select.Option value="overtime">
                    <Space>
                      <ClockCircleOutlined className="text-orange-500" />
                      Overtime
                    </Space>
                  </Select.Option>
                  <Select.Option value="remote">
                    <Space>
                      <EnvironmentOutlined className="text-green-500" />
                      Remote Work
                    </Space>
                  </Select.Option>
                  <Select.Option value="other">
                    <Space>
                      <FileTextOutlined className="text-gray-500" />
                      Other
                    </Space>
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="priority"
                label={
                  <span className="flex items-center gap-2 font-medium">
                    <AlertOutlined className="text-cyan-600" />
                    Priority Level
                  </span>
                }
                rules={[{ required: true, message: 'Please select priority' }]}
                tooltip="Select the urgency level of this application"
              >
                <Select 
                  placeholder="Select priority" 
                  size="large"
                  className="rounded-lg"
                >
                  <Select.Option value="low">
                    <Space>
                      <Tag color="default">Low</Tag>
                      Can wait
                    </Space>
                  </Select.Option>
                  <Select.Option value="medium">
                    <Space>
                      <Tag color="blue">Medium</Tag>
                      Normal priority
                    </Space>
                  </Select.Option>
                  <Select.Option value="high">
                    <Space>
                      <Tag color="orange">High</Tag>
                      Important
                    </Space>
                  </Select.Option>
                  <Select.Option value="urgent">
                    <Space>
                      <Tag color="red">Urgent</Tag>
                      <ThunderboltOutlined className="text-red-500" />
                      Immediate attention
                    </Space>
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <div className="h-full flex items-center">
                <Alert
                  message="Priority Guide"
                  description="Select urgency based on how soon approval is needed"
                  type="info"
                  showIcon
                  className="w-full"
                />
              </div>
            </Col>
          </Row>

          <Divider orientation="left">
            <Space>
              <CalendarOutlined className="text-cyan-600" />
              <span className="text-gray-700 dark:text-gray-300 font-semibold">Date Range</span>
            </Space>
          </Divider>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="startDate"
                label={
                  <span className="flex items-center gap-2 font-medium">
                    <CalendarOutlined className="text-cyan-600" />
                    Start Date
                  </span>
                }
                rules={[{ required: true, message: 'Please select start date' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                  size="large"
                  className="rounded-lg"
                  suffixIcon={<CalendarOutlined className="text-gray-400" />}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="endDate"
                label={
                  <span className="flex items-center gap-2 font-medium">
                    <CalendarOutlined className="text-cyan-600" />
                    End Date
                  </span>
                }
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
                  className="rounded-lg"
                  suffixIcon={<CalendarOutlined className="text-gray-400" />}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">
            <Space>
              <FileTextOutlined className="text-cyan-600" />
              <span className="text-gray-700 dark:text-gray-300 font-semibold">Reason & Justification</span>
            </Space>
          </Divider>

          <Form.Item
            name="reason"
            label={
              <span className="flex items-center gap-2 font-medium">
                <FileTextOutlined className="text-cyan-600" />
                Reason for Application
              </span>
            }
            rules={[
              { required: true, message: 'Please enter a reason' },
              { max: 500, message: 'Reason cannot exceed 500 characters' },
            ]}
            tooltip="Provide a clear explanation for this application"
          >
            <TextArea
              rows={5}
              placeholder="Please provide detailed information about your application..."
              showCount
              maxLength={500}
              className="rounded-lg"
            />
          </Form.Item>

          <Divider />

          <Form.Item className="mb-0">
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <Button 
                onClick={() => router.push(listPath)}
                size="large"
                icon={<ArrowLeftOutlined />}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<PlusOutlined />}
                loading={createApplicationMutation.isPending}
                size="large"
                className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 border-none hover:from-cyan-600 hover:to-blue-700"
              >
                Create Application
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
