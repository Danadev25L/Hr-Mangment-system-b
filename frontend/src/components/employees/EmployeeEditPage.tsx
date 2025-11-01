'use client'

import React, { useEffect, useState } from 'react'
import {
  Card,
  Button,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Row,
  Col,
  Breadcrumb,
  Space,
  DatePicker,
  Radio,
  Alert,
} from 'antd'
import {
  UserOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  HomeOutlined,
  TeamOutlined,
  EditOutlined,
  LockOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { useRouter, useParams } from 'next/navigation'
import dayjs from 'dayjs'

const { Option } = Select
const { Title, Text } = {
  Title: ({ children }: { children: React.ReactNode }) => (
    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{children}</h1>
  ),
  Text: ({ children }: { children: React.ReactNode }) => (
    <p className="text-gray-500 dark:text-gray-400">{children}</p>
  ),
}

interface EmployeeEditPageProps {
  role: 'admin' | 'manager'
}

export function EmployeeEditPage({ role }: EmployeeEditPageProps) {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const [selectedRole, setSelectedRole] = useState<string>('')

  const basePath = role === 'admin' ? '/admin' : '/manager'
  const listPath = `${basePath}/employees`
  const dashboardPath = `${basePath}/dashboard`
  const canEditRoleAndDepartment = role === 'admin'

  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiClient.getDepartments(),
    enabled: role === 'admin', // Only fetch departments for admins
  })

  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => apiClient.getUser(parseInt(id)),
    enabled: !!id,
  })

  const updateEmployeeMutation = useMutation({
    mutationFn: (data: any) => apiClient.updateUser(id, data),
    onSuccess: () => {
      message.success('Employee updated successfully')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', id] })
      queryClient.invalidateQueries({ queryKey: ['manager-employees'] })
      router.push(listPath)
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to update employee'

      // Enhanced error handling for specific scenarios
      if (errorMessage.includes('already has a manager')) {
        message.error({
          content: (
            <div>
              <strong>Manager Conflict Detected!</strong>
              <br />
              {errorMessage}
              <br />
              <br />
              <strong>Solutions:</strong>
              <br />
              • Choose a different department
              <br />
              • Change the role to &quot;Employee&quot; instead of &quot;Manager&quot;
              <br />• Remove the current manager from that department first
            </div>
          ),
          duration: 8,
          style: { marginTop: '20vh' },
        })
      } else if (errorMessage.includes('Password must contain')) {
        message.error({
          content: (
            <div>
              <strong>Password Requirements:</strong>
              <br />
              {errorMessage}
              <br />
              <br />
              Please ensure your password includes:
              <br />
              • At least 8 characters
              <br />
              • Uppercase and lowercase letters
              <br />
              • At least one number
              <br />• At least one special character (!@#$%^&*)
            </div>
          ),
          duration: 6,
        })
      } else if (errorMessage.includes('already exists')) {
        message.error({
          content: `${errorMessage}. Please choose a different value.`,
          duration: 4,
        })
      } else {
        message.error(errorMessage)
      }
    },
  })

  const handleRoleChange = (value: string) => {
    setSelectedRole(value)
    // Clear department if admin is selected (admin has no department)
    if (value === 'ROLE_ADMIN') {
      form.setFieldValue('departmentId', null)
    }
  }

  useEffect(() => {
    if (userData) {
      const data = userData.data
      // Format dates for DatePicker
      const formattedData = {
        ...data,
        // Handle department properly - extract ID if it's an object
        departmentId: typeof data.department === 'object' ? data.department?.id : data.departmentId,
        startDate: data.startDate ? dayjs(data.startDate) : undefined,
        endDate: data.endDate ? dayjs(data.endDate) : undefined,
        dateOfBirth: data.dateOfBirth ? dayjs(data.dateOfBirth) : undefined,
      }
      form.setFieldsValue(formattedData)
      setSelectedRole(data.role || '')
    }
  }, [userData, form])

  const handleSubmit = (values: any) => {
    // Format data for backend
    const formattedData = {
      ...values,
      startDate: values.startDate ? values.startDate.toISOString() : undefined,
      endDate: values.endDate ? values.endDate.toISOString() : undefined,
      dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : undefined,
    }

    // If manager, exclude role and keep original department
    if (!canEditRoleAndDepartment) {
      delete formattedData.role
      formattedData.departmentId = userData?.data?.department?.id || userData?.data?.departmentId
    } else {
      // Admin can change department, but clear it if admin role selected
      formattedData.departmentId = selectedRole === 'ROLE_ADMIN' ? null : values.departmentId
    }

    updateEmployeeMutation.mutate(formattedData)
  }

  if (isUserLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          {
            title: (
              <Space>
                <HomeOutlined />
                <span>Dashboard</span>
              </Space>
            ),
            href: dashboardPath,
          },
          {
            title: (
              <Space>
                <TeamOutlined />
                <span>{role === 'admin' ? 'Employees' : 'My Team'}</span>
              </Space>
            ),
            href: listPath,
          },
          {
            title: (
              <Space>
                <EditOutlined />
                <span>Edit Employee</span>
              </Space>
            ),
          },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title>Edit Employee</Title>
          <Text>Update the employee details below</Text>
        </div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push(listPath)}>
          Back to {role === 'admin' ? 'Employees' : 'Team'}
        </Button>
      </div>

      {/* Manager Alert */}
      {!canEditRoleAndDepartment && (
        <Alert
          message="Manager Restrictions"
          description="As a manager, you can update basic employee information, but you cannot change roles or transfer employees to other departments. Contact an administrator if you need to make these changes."
          type="info"
          showIcon
          closable
        />
      )}

      {/* Form */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Basic Information */}
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Card
                title="Account Information"
                size="small"
                className="mb-4 dark:bg-gray-700 dark:border-gray-600"
              >
                <Form.Item
                  name="fullName"
                  label="Full Name"
                  rules={[{ required: true, message: 'Please enter full name' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Enter full name" />
                </Form.Item>

                <Form.Item
                  name="username"
                  label="Username"
                  rules={[
                    { required: true, message: 'Please enter username' },
                    { min: 3, message: 'Username must be at least 3 characters' },
                  ]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Enter username" />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Please enter email' },
                    { type: 'email', message: 'Please enter a valid email' },
                  ]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Enter email address" />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Password"
                  help="Leave blank to keep the same password"
                  rules={[
                    { min: 8, message: 'Password must be at least 8 characters' },
                    { max: 128, message: 'Password must not exceed 128 characters' },
                    {
                      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()])[\w@$!%*?&^#()]+$/,
                      message:
                        'Password must contain uppercase, lowercase, number, and special character (@$!%*?&^#())',
                    },
                  ]}
                >
                  <Input.Password
                    placeholder="Enter new password (min 8 chars: Aa1@)"
                    title="Password must contain: 8+ characters, uppercase, lowercase, number, and special character"
                  />
                </Form.Item>

                <Form.Item name="employeeCode" label="Employee Code">
                  <Input
                    placeholder="Auto-generated"
                    readOnly
                    disabled
                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                  />
                </Form.Item>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card
                title="Employment Details"
                size="small"
                className="mb-4 dark:bg-gray-700 dark:border-gray-600"
              >
                {/* Role field - only for admin */}
                {canEditRoleAndDepartment && (
                  <Form.Item
                    name="role"
                    label="Role"
                    rules={[{ required: true, message: 'Please select role' }]}
                  >
                    <Select placeholder="Select role" onChange={handleRoleChange}>
                      <Option value="ROLE_ADMIN">Admin</Option>
                      <Option value="ROLE_MANAGER">Manager</Option>
                      <Option value="ROLE_EMPLOYEE">Employee</Option>
                    </Select>
                  </Form.Item>
                )}

                <Form.Item name="jobTitle" label="Job Title">
                  <Input placeholder="Enter job title" />
                </Form.Item>

                <Form.Item
                  name="departmentId"
                  label={
                    <span>
                      Department {!canEditRoleAndDepartment && <LockOutlined className="ml-1" />}
                    </span>
                  }
                  rules={
                    canEditRoleAndDepartment && selectedRole !== 'ROLE_ADMIN'
                      ? [{ required: true, message: 'Please select department' }]
                      : []
                  }
                >
                  <Select
                    placeholder="Select department"
                    disabled={!canEditRoleAndDepartment || selectedRole === 'ROLE_ADMIN'}
                  >
                    {Array.isArray(departmentsData) &&
                      departmentsData?.map((dept: any) => (
                        <Option key={dept.id} value={dept.id}>
                          {dept.departmentName}
                        </Option>
                      ))}
                  </Select>
                </Form.Item>

                <Form.Item name="baseSalary" label="Base Salary">
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="Enter base salary"
                    formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Item>

                <Form.Item name="employmentType" label="Employment Type">
                  <Select placeholder="Select employment type">
                    <Option value="Full-time">Full-time</Option>
                    <Option value="Part-time">Part-time</Option>
                    <Option value="Contract">Contract</Option>
                    <Option value="Internship">Internship</Option>
                  </Select>
                </Form.Item>

                <Form.Item name="workLocation" label="Work Location">
                  <Select placeholder="Select work location">
                    <Option value="Office">Office</Option>
                    <Option value="Remote">Remote</Option>
                    <Option value="Hybrid">Hybrid</Option>
                  </Select>
                </Form.Item>
              </Card>
            </Col>
          </Row>

          {/* Employment Dates */}
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Card
                title="Employment Dates"
                size="small"
                className="mb-4 dark:bg-gray-700 dark:border-gray-600"
              >
                <Form.Item
                  name="startDate"
                  label="Start Date"
                  rules={[{ required: true, message: 'Please select start date' }]}
                >
                  <DatePicker style={{ width: '100%' }} placeholder="Select start date" />
                </Form.Item>

                <Form.Item name="endDate" label="End Date (Optional)">
                  <DatePicker style={{ width: '100%' }} placeholder="Select end date" />
                </Form.Item>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card
                title="Contact Information"
                size="small"
                className="mb-4 dark:bg-gray-700 dark:border-gray-600"
              >
                <Form.Item name="phone" label="Phone Number">
                  <Input placeholder="Enter phone number" />
                </Form.Item>

                <Form.Item name="address" label="Address">
                  <Input placeholder="Enter address" />
                </Form.Item>

                <Form.Item name="city" label="City">
                  <Input placeholder="Enter city" />
                </Form.Item>

                <Form.Item name="country" label="Country">
                  <Input placeholder="Enter country" />
                </Form.Item>
              </Card>
            </Col>
          </Row>

          {/* Personal Information */}
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Card
                title="Personal Information"
                size="small"
                className="mb-4 dark:bg-gray-700 dark:border-gray-600"
              >
                <Form.Item name="dateOfBirth" label="Date of Birth">
                  <DatePicker style={{ width: '100%' }} placeholder="Select date of birth" />
                </Form.Item>

                <Form.Item name="gender" label="Gender">
                  <Radio.Group>
                    <Radio value="Male">Male</Radio>
                    <Radio value="Female">Female</Radio>
                    <Radio value="Other">Other</Radio>
                    <Radio value="Prefer not to say">Prefer not to say</Radio>
                  </Radio.Group>
                </Form.Item>

                <Form.Item name="maritalStatus" label="Marital Status">
                  <Select placeholder="Select marital status">
                    <Option value="Single">Single</Option>
                    <Option value="Married">Married</Option>
                    <Option value="Divorced">Divorced</Option>
                    <Option value="Widowed">Widowed</Option>
                  </Select>
                </Form.Item>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card
                title="Emergency Contact"
                size="small"
                className="mb-4 dark:bg-gray-700 dark:border-gray-600"
              >
                <Form.Item name="emergencyContact" label="Emergency Contact Name">
                  <Input placeholder="Enter emergency contact name" />
                </Form.Item>

                <Form.Item name="emergencyPhone" label="Emergency Contact Phone">
                  <Input placeholder="Enter emergency contact phone" />
                </Form.Item>
              </Card>
            </Col>
          </Row>

          <div className="flex justify-end gap-4">
            <Button onClick={() => router.push(listPath)}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={updateEmployeeMutation.isPending}
            >
              Update Employee
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  )
}
