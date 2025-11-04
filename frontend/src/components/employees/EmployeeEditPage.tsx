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
  CalendarOutlined,
  PhoneOutlined,
  MailOutlined,
  IdcardOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  HeartOutlined,
  ManOutlined,
  WomanOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { useRouter, useParams } from 'next/navigation'
import dayjs from 'dayjs'
import { useLocale } from 'next-intl'
import { EnhancedCard, EnhancedButton } from '@/components/ui'
import { EmployeesIllustration } from '@/components/ui/illustrations'

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
  const locale = useLocale()
  const id = params.id as string
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const [selectedRole, setSelectedRole] = useState<string>('')

  const basePath = role === 'admin' ? '/admin' : '/manager'
  const listPath = `/${locale}${basePath}/employees`
  const dashboardPath = `/${locale}${basePath}/dashboard`
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
              <span className="flex items-center gap-2 cursor-pointer" onClick={() => router.push(dashboardPath)}>
                <HomeOutlined />
                <span>Dashboard</span>
              </span>
            ),
          },
          {
            title: (
              <span className="flex items-center gap-2 cursor-pointer" onClick={() => router.push(listPath)}>
                <TeamOutlined />
                <span>{role === 'admin' ? 'Employees' : 'My Team'}</span>
              </span>
            ),
          },
          {
            title: 'Edit Employee',
          },
        ]}
      />

      {/* Header */}
      <EnhancedCard>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="hidden md:block">
              <EmployeesIllustration className="w-20 h-20" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Edit Employee
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Update the employee details below
              </p>
            </div>
          </div>
          <EnhancedButton
            variant="ghost"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push(listPath)}
          >
            Back to {role === 'admin' ? 'Employees' : 'Team'}
          </EnhancedButton>
        </div>
      </EnhancedCard>

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
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <EnhancedCard>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <UserOutlined className="text-white text-lg" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Account Information</h3>
              </div>
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
                  <Input prefix={<MailOutlined />} placeholder="Enter email address" />
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
                    prefix={<LockOutlined />}
                    placeholder="Enter new password (min 8 chars: Aa1@)"
                    title="Password must contain: 8+ characters, uppercase, lowercase, number, and special character"
                  />
                </Form.Item>

                <Form.Item name="employeeCode" label="Employee Code">
                  <Input
                    prefix={<IdcardOutlined />}
                    placeholder="Auto-generated"
                    readOnly
                    disabled
                    className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                  />
                </Form.Item>
              </EnhancedCard>
            </Col>

            <Col xs={24} lg={12}>
              <EnhancedCard>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                    <TeamOutlined className="text-white text-lg" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Employment Details</h3>
                </div>
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
                  <Input prefix={<UserOutlined />} placeholder="Enter job title" />
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
                    prefix={<DollarOutlined />}
                    className="w-full"
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
              </EnhancedCard>
            </Col>
          </Row>

          {/* Employment Dates */}
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <EnhancedCard>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                    <CalendarOutlined className="text-white text-lg" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Employment Dates</h3>
                </div>
                <Form.Item
                  name="startDate"
                  label="Start Date"
                  rules={[{ required: true, message: 'Please select start date' }]}
                >
                  <DatePicker style={{ width: '100%' }} placeholder="Select start date" />
                </Form.Item>

                <Form.Item name="endDate" label="End Date (Optional)">
                  <DatePicker className="w-full" placeholder="Select end date" />
                </Form.Item>
              </EnhancedCard>
            </Col>

            <Col xs={24} lg={12}>
              <EnhancedCard>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center">
                    <PhoneOutlined className="text-white text-lg" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Contact Information</h3>
                </div>
                <Form.Item name="phone" label="Phone Number">
                  <Input prefix={<PhoneOutlined />} placeholder="Enter phone number" />
                </Form.Item>

                <Form.Item name="address" label="Address">
                  <Input prefix={<EnvironmentOutlined />} placeholder="Enter address" />
                </Form.Item>

                <Form.Item name="city" label="City">
                  <Input prefix={<EnvironmentOutlined />} placeholder="Enter city" />
                </Form.Item>

                <Form.Item name="country" label="Country">
                  <Input prefix={<GlobalOutlined />} placeholder="Enter country" />
                </Form.Item>
              </EnhancedCard>
            </Col>
          </Row>

          {/* Personal Information */}
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <EnhancedCard>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <IdcardOutlined className="text-white text-lg" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Personal Information</h3>
                </div>

                <Form.Item name="dateOfBirth" label="Date of Birth">
                  <DatePicker className="w-full" placeholder="Select date of birth" suffixIcon={<CalendarOutlined />} />
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
                  <Select placeholder="Select marital status" suffixIcon={<HeartOutlined />}>
                    <Option value="Single">Single</Option>
                    <Option value="Married">Married</Option>
                    <Option value="Divorced">Divorced</Option>
                    <Option value="Widowed">Widowed</Option>
                  </Select>
                </Form.Item>
              </EnhancedCard>
            </Col>

            <Col xs={24} lg={12}>
              <EnhancedCard>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg flex items-center justify-center">
                    <PhoneOutlined className="text-white text-lg" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Emergency Contact</h3>
                </div>

                <Form.Item name="emergencyContact" label="Emergency Contact Name">
                  <Input prefix={<UserOutlined />} placeholder="Enter emergency contact name" />
                </Form.Item>

                <Form.Item name="emergencyPhone" label="Emergency Contact Phone">
                  <Input prefix={<PhoneOutlined />} placeholder="Enter emergency contact phone" />
                </Form.Item>
              </EnhancedCard>
            </Col>
          </Row>

          <EnhancedCard>
            <div className="flex justify-end gap-4">
              <EnhancedButton variant="ghost" onClick={() => router.push(listPath)}>
                Cancel
              </EnhancedButton>
              <EnhancedButton
                variant="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={updateEmployeeMutation.isPending}
              >
                Update Employee
              </EnhancedButton>
            </div>
          </EnhancedCard>
        </Form>
    </div>
  )
}
