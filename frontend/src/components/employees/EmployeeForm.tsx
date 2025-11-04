'use client'

import React, { useState } from 'react'
import { Form, Input, Button, Row, Col, Divider, DatePicker, Select, Card, Space, Tag, Tooltip } from 'antd'
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  HomeOutlined, 
  DollarOutlined,
  IdcardOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  SafetyOutlined,
  HeartOutlined,
  ManOutlined,
  WomanOutlined,
  GlobalOutlined,
  ContactsOutlined,
  BankOutlined,
  AuditOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
  CloseOutlined,
  SaveOutlined
} from '@ant-design/icons'
import type { FormInstance } from 'antd'

const { Option } = Select

interface EmployeeFormProps {
  form: FormInstance
  onFinish: (values: any) => void
  loading: boolean
  onCancel: () => void
  isAdmin?: boolean
  userDepartment?: string
  departments?: Array<{ id: number; departmentName: string }>
  isEditMode?: boolean
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  form,
  onFinish,
  loading,
  onCancel,
  isAdmin = false,
  userDepartment,
  departments = [],
  isEditMode = false,
}) => {
  const [selectedRole, setSelectedRole] = useState<string>('')

  const handleRoleChange = (value: string) => {
    setSelectedRole(value)
    // Clear department if admin is selected
    if (value === 'ROLE_ADMIN') {
      form.setFieldValue('departmentId', null)
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      autoComplete="off"
      requiredMark="optional"
      className="employee-form"
    >
      {/* Basic Information */}
      <Card className="mb-6 shadow-sm border-l-4 border-l-blue-500 dark:bg-gray-800">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
            <IdcardOutlined className="text-blue-600 dark:text-blue-400 text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 m-0">
              Basic Information
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 m-0">
              Personal identification and account details
            </p>
          </div>
        </div>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={
                <span className="flex items-center gap-2 font-medium">
                  <UserOutlined className="text-blue-500" />
                  Full Name
                </span>
              }
              name="fullName"
              rules={[
                { required: true, message: 'Please enter full name' },
                { min: 3, message: 'Name must be at least 3 characters' }
              ]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="John Doe"
                size="large"
                className="rounded-lg"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={
                <span className="flex items-center gap-2 font-medium">
                  <ContactsOutlined className="text-blue-500" />
                  Username
                </span>
              }
              name="username"
              rules={[
                { required: true, message: 'Please enter username' },
                { min: 4, message: 'Username must be at least 4 characters' },
                {
                  pattern: /^[a-zA-Z0-9._]+$/,
                  message: 'Username can only contain letters, numbers, dots, and underscores'
                }
              ]}
            >
              <Input
                prefix={<ContactsOutlined className="text-gray-400" />}
                placeholder="john.doe"
                size="large"
                disabled={isEditMode}
                className="rounded-lg"
                suffix={
                  isEditMode && (
                    <Tag color="orange" className="m-0">
                      <SafetyCertificateOutlined /> Cannot Edit
                    </Tag>
                  )
                }
              />
            </Form.Item>
          </Col>
        </Row>

        {!isEditMode && (
          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item
                label={
                  <span className="flex items-center gap-2 font-medium">
                    <LockOutlined className="text-blue-500" />
                    Password
                  </span>
                }
                name="password"
                rules={[
                  { required: true, message: 'Please enter password' },
                  { min: 8, message: 'Password must be at least 8 characters' },
                  { max: 128, message: 'Password must not exceed 128 characters' },
                  {
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()])[\w@$!%*?&^#()]+$/,
                    message: 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&^#())'
                  }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="Enter secure password (min 8 chars: Aa1@)"
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>
              <div className="flex flex-wrap gap-2 -mt-2 mb-2">
                <Tag icon={<SafetyCertificateOutlined />} color="success">Uppercase</Tag>
                <Tag icon={<SafetyCertificateOutlined />} color="processing">Lowercase</Tag>
                <Tag icon={<SafetyCertificateOutlined />} color="warning">Number</Tag>
                <Tag icon={<SafetyCertificateOutlined />} color="error">Special Char</Tag>
              </div>
            </Col>
          </Row>
        )}
      </Card>

      {/* Job Information */}
      <Card className="mb-6 shadow-sm border-l-4 border-l-green-500 dark:bg-gray-800">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-3">
            <AuditOutlined className="text-green-600 dark:text-green-400 text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 m-0">
              Job Information
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 m-0">
              Employment details and work arrangements
            </p>
          </div>
        </div>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={
                <span className="flex items-center gap-2 font-medium">
                  <StarOutlined className="text-green-500" />
                  Job Title
                </span>
              }
              name="jobTitle"
              rules={[{ required: true, message: 'Please enter job title' }]}
            >
              <Input
                prefix={<StarOutlined className="text-gray-400" />}
                placeholder="e.g., Software Engineer"
                size="large"
                className="rounded-lg"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={
                <span className="flex items-center gap-2 font-medium">
                  <DollarOutlined className="text-green-500" />
                  Base Salary
                </span>
              }
              name="baseSalary"
              rules={[
                { required: true, message: 'Please enter base salary' },
                {
                  pattern: /^\d+(\.\d{1,2})?$/,
                  message: 'Please enter a valid salary amount'
                }
              ]}
            >
              <Input
                prefix={<DollarOutlined className="text-gray-400" />}
                placeholder="50,000.00"
                size="large"
                type="number"
                className="rounded-lg"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={
                <span className="flex items-center gap-2 font-medium">
                  <ClockCircleOutlined className="text-green-500" />
                  Employment Type
                </span>
              }
              name="employmentType"
              initialValue="Full-time"
            >
              <Select placeholder="Select employment type" size="large" className="rounded-lg">
                <Option value="Full-time">
                  <Space>
                    <ClockCircleOutlined />
                    Full-time
                  </Space>
                </Option>
                <Option value="Part-time">
                  <Space>
                    <ClockCircleOutlined />
                    Part-time
                  </Space>
                </Option>
                <Option value="Contract">
                  <Space>
                    <AuditOutlined />
                    Contract
                  </Space>
                </Option>
                <Option value="Intern">
                  <Space>
                    <StarOutlined />
                    Intern
                  </Space>
                </Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={
                <span className="flex items-center gap-2 font-medium">
                  <EnvironmentOutlined className="text-green-500" />
                  Work Location
                </span>
              }
              name="workLocation"
              initialValue="Office"
            >
              <Select placeholder="Select work location" size="large" className="rounded-lg">
                <Option value="Office">
                  <Space>
                    <BankOutlined />
                    Office
                  </Space>
                </Option>
                <Option value="Remote">
                  <Space>
                    <HomeOutlined />
                    Remote
                  </Space>
                </Option>
                <Option value="Hybrid">
                  <Space>
                    <GlobalOutlined />
                    Hybrid
                  </Space>
                </Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={
                <span className="flex items-center gap-2 font-medium">
                  <CalendarOutlined className="text-green-500" />
                  Start Date
                </span>
              }
              name="startDate"
              rules={[{ required: true, message: 'Please select start date' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                size="large"
                placeholder="Select start date"
                className="rounded-lg"
                suffixIcon={<CalendarOutlined className="text-gray-400" />}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={
                <span className="flex items-center gap-2 font-medium">
                  <CalendarOutlined className="text-green-500" />
                  End Date <Tag color="default" className="ml-2">Optional</Tag>
                </span>
              }
              name="endDate"
            >
              <DatePicker
                style={{ width: '100%' }}
                size="large"
                placeholder="Select end date (if applicable)"
                className="rounded-lg"
                suffixIcon={<CalendarOutlined className="text-gray-400" />}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            {isAdmin ? (
              <Form.Item
                label={
                  <span className="flex items-center gap-2 font-medium">
                    <BankOutlined className="text-green-500" />
                    Department
                  </span>
                }
                name="departmentId"
                rules={selectedRole !== 'ROLE_ADMIN' ? [{ required: true, message: 'Please select department' }] : []}
                help={selectedRole === 'ROLE_ADMIN' ? '🔒 Admin users do not belong to any department' : ''}
              >
                <Select
                  placeholder="Select department"
                  size="large"
                  showSearch
                  optionFilterProp="children"
                  disabled={selectedRole === 'ROLE_ADMIN'}
                  className="rounded-lg"
                  suffixIcon={<BankOutlined className="text-gray-400" />}
                >
                  {departments.map((dept) => (
                    <Option key={dept.id} value={dept.id}>
                      <Space>
                        <BankOutlined />
                        {dept.departmentName}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            ) : (
              <>
                <Form.Item
                  label={
                    <span className="flex items-center gap-2 font-medium">
                      <BankOutlined className="text-green-500" />
                      Department
                    </span>
                  }
                  name="department"
                >
                  <Input
                    prefix={<BankOutlined className="text-gray-400" />}
                    value={userDepartment || 'Your Department'}
                    disabled
                    size="large"
                    placeholder={userDepartment || 'Your Department'}
                    className="bg-gray-100 dark:bg-gray-800 rounded-lg"
                  />
                </Form.Item>
                <p className="text-xs text-blue-600 dark:text-blue-400 -mt-2 flex items-center gap-1">
                  <SafetyCertificateOutlined />
                  Employee will be assigned to your department automatically
                </p>
              </>
            )}
          </Col>

          <Col xs={24} md={12}>
            {isAdmin ? (
              <Form.Item
                label={
                  <span className="flex items-center gap-2 font-medium">
                    <TeamOutlined className="text-green-500" />
                    Role
                  </span>
                }
                name="role"
                rules={[{ required: true, message: 'Please select role' }]}
              >
                <Select 
                  placeholder="Select role" 
                  size="large" 
                  onChange={handleRoleChange}
                  className="rounded-lg"
                  suffixIcon={<TeamOutlined className="text-gray-400" />}
                >
                  <Option value="ROLE_ADMIN">
                    <Space>
                      <SafetyCertificateOutlined className="text-red-500" />
                      Admin
                    </Space>
                  </Option>
                  <Option value="ROLE_MANAGER">
                    <Space>
                      <TeamOutlined className="text-blue-500" />
                      Manager
                    </Space>
                  </Option>
                  <Option value="ROLE_EMPLOYEE">
                    <Space>
                      <UserOutlined className="text-green-500" />
                      Employee
                    </Space>
                  </Option>
                </Select>
              </Form.Item>
            ) : (
              <>
                <Form.Item
                  label={
                    <span className="flex items-center gap-2 font-medium">
                      <TeamOutlined className="text-green-500" />
                      Role
                    </span>
                  }
                  name="role"
                >
                  <Input
                    prefix={<UserOutlined className="text-gray-400" />}
                    value="Employee"
                    disabled
                    size="large"
                    placeholder="Employee"
                    className="bg-gray-100 dark:bg-gray-800 rounded-lg"
                  />
                </Form.Item>
                <p className="text-xs text-blue-600 dark:text-blue-400 -mt-2 flex items-center gap-1">
                  <SafetyCertificateOutlined />
                  Managers can only create employee accounts
                </p>
              </>
            )}
          </Col>
        </Row>
      </Card>

      {/* Contact Information */}
      <Card className="mb-6 shadow-sm border-l-4 border-l-purple-500 dark:bg-gray-800">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-3">
            <ContactsOutlined className="text-purple-600 dark:text-purple-400 text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 m-0">
              Contact Information
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 m-0">
              Communication and personal details
            </p>
          </div>
        </div>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={
                <span className="flex items-center gap-2 font-medium">
                  <MailOutlined className="text-purple-500" />
                  Email Address
                </span>
              }
              name="email"
              rules={[
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-gray-400" />}
                placeholder="john.doe@company.com"
                size="large"
                className="rounded-lg"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={
                <span className="flex items-center gap-2 font-medium">
                  <PhoneOutlined className="text-purple-500" />
                  Phone Number
                </span>
              }
              name="phone"
            >
              <Input
                prefix={<PhoneOutlined className="text-gray-400" />}
                placeholder="+1 (555) 123-4567"
                size="large"
                className="rounded-lg"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={
                <span className="flex items-center gap-2 font-medium">
                  <CalendarOutlined className="text-purple-500" />
                  Date of Birth
                </span>
              }
              name="dateOfBirth"
            >
              <DatePicker
                style={{ width: '100%' }}
                size="large"
                placeholder="Select date of birth"
                className="rounded-lg"
                suffixIcon={<CalendarOutlined className="text-gray-400" />}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={
                <span className="flex items-center gap-2 font-medium">
                  <UserOutlined className="text-purple-500" />
                  Gender
                </span>
              }
              name="gender"
            >
              <Select placeholder="Select gender" size="large" allowClear className="rounded-lg">
                <Option value="Male">
                  <Space>
                    <ManOutlined className="text-blue-500" />
                    Male
                  </Space>
                </Option>
                <Option value="Female">
                  <Space>
                    <WomanOutlined className="text-pink-500" />
                    Female
                  </Space>
                </Option>
                <Option value="Other">
                  <Space>
                    <UserOutlined />
                    Other
                  </Space>
                </Option>
                <Option value="Prefer not to say">
                  <Space>
                    <SafetyOutlined />
                    Prefer not to say
                  </Space>
                </Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={
                <span className="flex items-center gap-2 font-medium">
                  <HeartOutlined className="text-purple-500" />
                  Marital Status
                </span>
              }
              name="maritalStatus"
            >
              <Select placeholder="Select marital status" size="large" allowClear className="rounded-lg">
                <Option value="Single">
                  <Space>
                    <UserOutlined />
                    Single
                  </Space>
                </Option>
                <Option value="Married">
                  <Space>
                    <HeartOutlined className="text-red-500" />
                    Married
                  </Space>
                </Option>
                <Option value="Divorced">
                  <Space>
                    <UserOutlined />
                    Divorced
                  </Space>
                </Option>
                <Option value="Widowed">
                  <Space>
                    <UserOutlined />
                    Widowed
                  </Space>
                </Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={
                <span className="flex items-center gap-2 font-medium">
                  <HomeOutlined className="text-purple-500" />
                  Address
                </span>
              }
              name="address"
            >
              <Input
                prefix={<HomeOutlined className="text-gray-400" />}
                placeholder="123 Main Street"
                size="large"
                className="rounded-lg"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={
                <span className="flex items-center gap-2 font-medium">
                  <EnvironmentOutlined className="text-purple-500" />
                  City
                </span>
              }
              name="city"
            >
              <Input 
                prefix={<EnvironmentOutlined className="text-gray-400" />}
                placeholder="New York" 
                size="large" 
                className="rounded-lg"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={
                <span className="flex items-center gap-2 font-medium">
                  <GlobalOutlined className="text-purple-500" />
                  Country
                </span>
              }
              name="country"
            >
              <Input 
                prefix={<GlobalOutlined className="text-gray-400" />}
                placeholder="United States" 
                size="large" 
                className="rounded-lg"
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Emergency Contact */}
      <Card className="mb-6 shadow-sm border-l-4 border-l-red-500 dark:bg-gray-800">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mr-3">
            <SafetyOutlined className="text-red-600 dark:text-red-400 text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 m-0">
              Emergency Contact
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 m-0">
              Person to contact in case of emergency
            </p>
          </div>
        </div>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={
                <span className="flex items-center gap-2 font-medium">
                  <ContactsOutlined className="text-red-500" />
                  Emergency Contact Name
                </span>
              }
              name="emergencyContact"
            >
              <Input 
                prefix={<ContactsOutlined className="text-gray-400" />}
                placeholder="Jane Doe (Mother/Spouse/Friend)" 
                size="large" 
                className="rounded-lg"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={
                <span className="flex items-center gap-2 font-medium">
                  <PhoneOutlined className="text-red-500" />
                  Emergency Contact Phone
                </span>
              }
              name="emergencyPhone"
            >
              <Input
                prefix={<PhoneOutlined className="text-gray-400" />}
                placeholder="+1 (555) 987-6543"
                size="large"
                className="rounded-lg"
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          size="large"
          onClick={onCancel}
          className="rounded-lg"
          icon={<CloseOutlined />}
        >
          Cancel
        </Button>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={loading}
          className="rounded-lg"
          icon={<SaveOutlined />}
        >
          {isEditMode ? 'Update Employee' : 'Create Employee'}
        </Button>
      </div>
    </Form>
  )
}
