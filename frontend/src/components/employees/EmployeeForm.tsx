'use client'

import React, { useState } from 'react'
import { Form, Input, Button, Row, Col, Divider, DatePicker, Select } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, HomeOutlined, DollarOutlined } from '@ant-design/icons'
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
    >
      {/* Basic Information */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Basic Information
        </h3>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Full Name"
              name="fullName"
              rules={[
                { required: true, message: 'Please enter full name' },
                { min: 3, message: 'Name must be at least 3 characters' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter full name"
                size="large"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Username"
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
                prefix={<UserOutlined />}
                placeholder="Enter username"
                size="large"
                disabled={isEditMode}
              />
            </Form.Item>
          </Col>
        </Row>

        {!isEditMode && (
          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item
                label="Password"
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
                  prefix={<LockOutlined />}
                  placeholder="Enter password (min 8 chars: Aa1@)"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
        )}
      </div>

      <Divider />

      {/* Job Information */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Job Information
        </h3>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Job Title"
              name="jobTitle"
              rules={[{ required: true, message: 'Please enter job title' }]}
            >
              <Input
                placeholder="e.g., Software Engineer"
                size="large"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Base Salary"
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
                prefix={<DollarOutlined />}
                placeholder="Enter base salary"
                size="large"
                type="number"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Employment Type"
              name="employmentType"
              initialValue="Full-time"
            >
              <Select placeholder="Select employment type" size="large">
                <Option value="Full-time">Full-time</Option>
                <Option value="Part-time">Part-time</Option>
                <Option value="Contract">Contract</Option>
                <Option value="Intern">Intern</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Work Location"
              name="workLocation"
              initialValue="Office"
            >
              <Select placeholder="Select work location" size="large">
                <Option value="Office">Office</Option>
                <Option value="Remote">Remote</Option>
                <Option value="Hybrid">Hybrid</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Start Date"
              name="startDate"
              rules={[{ required: true, message: 'Please select start date' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                size="large"
                placeholder="Select start date"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="End Date (Optional)"
              name="endDate"
            >
              <DatePicker
                style={{ width: '100%' }}
                size="large"
                placeholder="Select end date"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            {isAdmin ? (
              <Form.Item
                label="Department"
                name="departmentId"
                rules={selectedRole !== 'ROLE_ADMIN' ? [{ required: true, message: 'Please select department' }] : []}
                help={selectedRole === 'ROLE_ADMIN' ? 'Admin users do not belong to any department' : ''}
              >
                <Select
                  placeholder="Select department"
                  size="large"
                  showSearch
                  optionFilterProp="children"
                  disabled={selectedRole === 'ROLE_ADMIN'}
                >
                  {departments.map((dept) => (
                    <Option key={dept.id} value={dept.id}>
                      {dept.departmentName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            ) : (
              <>
                <Form.Item
                  label="Department"
                  name="department"
                >
                  <Input
                    value={userDepartment || 'Your Department'}
                    disabled
                    size="large"
                    placeholder={userDepartment || 'Your Department'}
                    className="bg-gray-100 dark:bg-gray-800"
                  />
                </Form.Item>
                <p className="text-xs text-gray-500 -mt-2">
                  Employee will be assigned to your department automatically
                </p>
              </>
            )}
          </Col>

          <Col xs={24} md={12}>
            {isAdmin ? (
              <Form.Item
                label="Role"
                name="role"
                rules={[{ required: true, message: 'Please select role' }]}
              >
                <Select placeholder="Select role" size="large" onChange={handleRoleChange}>
                  <Option value="ROLE_ADMIN">Admin</Option>
                  <Option value="ROLE_MANAGER">Manager</Option>
                  <Option value="ROLE_EMPLOYEE">Employee</Option>
                </Select>
              </Form.Item>
            ) : (
              <>
                <Form.Item
                  label="Role"
                  name="role"
                >
                  <Input
                    value="Employee"
                    disabled
                    size="large"
                    placeholder="Employee"
                    className="bg-gray-100 dark:bg-gray-800"
                  />
                </Form.Item>
                <p className="text-xs text-gray-500 -mt-2">
                  Managers can only create employee accounts
                </p>
              </>
            )}
          </Col>
        </Row>
      </div>

      <Divider />

      {/* Contact Information */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Contact Information
        </h3>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Enter email address"
                size="large"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Phone"
              name="phone"
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="Enter phone number"
                size="large"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Date of Birth"
              name="dateOfBirth"
            >
              <DatePicker
                style={{ width: '100%' }}
                size="large"
                placeholder="Select date of birth"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Gender"
              name="gender"
            >
              <Select placeholder="Select gender" size="large" allowClear>
                <Option value="Male">Male</Option>
                <Option value="Female">Female</Option>
                <Option value="Other">Other</Option>
                <Option value="Prefer not to say">Prefer not to say</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Marital Status"
              name="maritalStatus"
            >
              <Select placeholder="Select marital status" size="large" allowClear>
                <Option value="Single">Single</Option>
                <Option value="Married">Married</Option>
                <Option value="Divorced">Divorced</Option>
                <Option value="Widowed">Widowed</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Address"
              name="address"
            >
              <Input
                prefix={<HomeOutlined />}
                placeholder="Enter address"
                size="large"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="City"
              name="city"
            >
              <Input placeholder="Enter city" size="large" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Country"
              name="country"
            >
              <Input placeholder="Enter country" size="large" />
            </Form.Item>
          </Col>
        </Row>
      </div>

      <Divider />

      {/* Emergency Contact */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Emergency Contact
        </h3>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Emergency Contact Name"
              name="emergencyContact"
            >
              <Input placeholder="Enter emergency contact name" size="large" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Emergency Contact Phone"
              name="emergencyPhone"
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="Enter emergency contact phone"
                size="large"
              />
            </Form.Item>
          </Col>
        </Row>
      </div>

      <Divider />

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Button
          size="large"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={loading}
        >
          {isEditMode ? 'Update Employee' : 'Create Employee'}
        </Button>
      </div>
    </Form>
  )
}
