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
import { useTranslations } from 'next-intl'

const { Option } = Select

interface EmployeeFormProps {
  form: FormInstance
  onFinish: (values: any) => void
  loading: boolean
  onCancel: () => void
  isAdmin?: boolean
  userDepartment?: string
  departments?: Array<{ id: number; departmentName: string; manager?: { id: number; fullName: string } | null }>
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
  const t = useTranslations()
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null)

  const handleRoleChange = (value: string) => {
    setSelectedRole(value)
    // Clear department if admin is selected
    if (value === 'ROLE_ADMIN') {
      form.setFieldValue('departmentId', null)
      setSelectedDepartment(null)
    }
  }

  const handleDepartmentChange = (value: number) => {
    setSelectedDepartment(value)
  }

  // Find the selected department's manager
  const getSelectedDepartmentManager = () => {
    if (!selectedDepartment) return null
    const dept = departments.find(d => d.id === selectedDepartment)
    return dept?.manager || null
  }

  const selectedDeptManager = getSelectedDepartmentManager()
  const showManagerWarning = selectedRole === 'ROLE_MANAGER' && selectedDeptManager

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
              {t('employees.formSections.basicInformation')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 m-0">
              {t('employees.formSections.basicInformationDesc')}
            </p>
          </div>
        </div>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={
                <span className="flex items-center gap-2 font-medium">
                  <UserOutlined className="text-blue-500" />
                  {t('employees.form.fullName')}
                </span>
              }
              name="fullName"
              rules={[
                { required: true, message: t('employees.form.fullNameRequired') },
                { min: 3, message: t('employees.form.fullNameMinLength') }
              ]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder={t('employees.form.fullNamePlaceholder')}
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
                  {t('employees.form.username')}
                </span>
              }
              name="username"
              rules={[
                { required: true, message: t('employees.form.usernameRequired') },
                { min: 4, message: t('employees.form.usernameMinLength') },
                {
                  pattern: /^[a-zA-Z0-9._]+$/,
                  message: t('employees.form.usernamePattern')
                }
              ]}
            >
              <Input
                prefix={<ContactsOutlined className="text-gray-400" />}
                placeholder={t('employees.form.usernamePlaceholder')}
                size="large"
                disabled={isEditMode}
                className="rounded-lg"
                suffix={
                  isEditMode && (
                    <Tag color="orange" className="m-0">
                      <SafetyCertificateOutlined /> {t('employees.form.usernameCannotEdit')}
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
                    {t('employees.form.password')}
                  </span>
                }
                name="password"
                rules={[
                  { required: true, message: t('employees.form.passwordRequired') },
                  { min: 8, message: t('employees.form.passwordMinLength') },
                  { max: 128, message: t('employees.form.passwordMaxLength') },
                  {
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()])[\w@$!%*?&^#()]+$/,
                    message: t('employees.form.passwordPattern')
                  }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder={t('employees.form.passwordPlaceholder')}
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>
              <div className="flex flex-wrap gap-2 -mt-2 mb-2">
                <Tag icon={<SafetyCertificateOutlined />} color="success">{t('employees.form.passwordRequirements.uppercase')}</Tag>
                <Tag icon={<SafetyCertificateOutlined />} color="processing">{t('employees.form.passwordRequirements.lowercase')}</Tag>
                <Tag icon={<SafetyCertificateOutlined />} color="warning">{t('employees.form.passwordRequirements.number')}</Tag>
                <Tag icon={<SafetyCertificateOutlined />} color="error">{t('employees.form.passwordRequirements.specialChar')}</Tag>
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
              {t('employees.formSections.jobInformation')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 m-0">
              {t('employees.formSections.jobInformationDesc')}
            </p>
          </div>
        </div>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={
                <span className="flex items-center gap-2 font-medium">
                  <StarOutlined className="text-green-500" />
                  {t('employees.form.jobTitle')}
                </span>
              }
              name="jobTitle"
              rules={[{ required: true, message: t('employees.form.jobTitleRequired') }]}
            >
              <Input
                prefix={<StarOutlined className="text-gray-400" />}
                placeholder={t('employees.form.jobTitlePlaceholder')}
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
                  {t('employees.form.baseSalary')}
                </span>
              }
              name="baseSalary"
              rules={[
                { required: true, message: t('employees.form.baseSalaryRequired') },
                {
                  pattern: /^\d+(\.\d{1,2})?$/,
                  message: t('employees.form.baseSalaryPattern')
                }
              ]}
            >
              <Input
                prefix={<DollarOutlined className="text-gray-400" />}
                placeholder={t('employees.form.baseSalaryPlaceholder')}
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
                  {t('employees.form.employmentType')}
                </span>
              }
              name="employmentType"
              initialValue="Full-time"
            >
              <Select placeholder={t('employees.form.employmentTypePlaceholder')} size="large" className="rounded-lg">
                <Option value="Full-time">
                  <Space>
                    <ClockCircleOutlined />
                    {t('employees.form.fullTime')}
                  </Space>
                </Option>
                <Option value="Part-time">
                  <Space>
                    <ClockCircleOutlined />
                    {t('employees.form.partTime')}
                  </Space>
                </Option>
                <Option value="Contract">
                  <Space>
                    <AuditOutlined />
                    {t('employees.form.contract')}
                  </Space>
                </Option>
                <Option value="Intern">
                  <Space>
                    <StarOutlined />
                    {t('employees.form.intern')}
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
                  {t('employees.form.workLocation')}
                </span>
              }
              name="workLocation"
              initialValue="Office"
            >
              <Select placeholder={t('employees.form.workLocationPlaceholder')} size="large" className="rounded-lg">
                <Option value="Office">
                  <Space>
                    <BankOutlined />
                    {t('employees.form.office')}
                  </Space>
                </Option>
                <Option value="Remote">
                  <Space>
                    <HomeOutlined />
                    {t('employees.form.remote')}
                  </Space>
                </Option>
                <Option value="Hybrid">
                  <Space>
                    <GlobalOutlined />
                    {t('employees.form.hybrid')}
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
                  {t('employees.form.startDate')}
                </span>
              }
              name="startDate"
              rules={[{ required: true, message: t('employees.form.startDateRequired') }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                size="large"
                placeholder={t('employees.form.startDatePlaceholder')}
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
                  {t('employees.form.endDate')} <Tag color="default" className="ml-2">{t('employees.form.optional')}</Tag>
                </span>
              }
              name="endDate"
            >
              <DatePicker
                style={{ width: '100%' }}
                size="large"
                placeholder={t('employees.form.endDatePlaceholder')}
                className="rounded-lg"
                suffixIcon={<CalendarOutlined className="text-gray-400" />}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            {isAdmin ? (
              <>
                <Form.Item
                  label={
                    <span className="flex items-center gap-2 font-medium">
                      <BankOutlined className="text-green-500" />
                      {t('employees.form.department')}
                    </span>
                  }
                  name="departmentId"
                  rules={selectedRole !== 'ROLE_ADMIN' ? [{ required: true, message: t('employees.form.departmentRequired') }] : []}
                  help={selectedRole === 'ROLE_ADMIN' ? t('employees.form.departmentAdminNote') : ''}
                >
                  <Select
                    placeholder={t('employees.form.departmentPlaceholder')}
                    size="large"
                    showSearch
                    optionFilterProp="children"
                    disabled={selectedRole === 'ROLE_ADMIN'}
                    className="rounded-lg"
                    suffixIcon={<BankOutlined className="text-gray-400" />}
                    onChange={handleDepartmentChange}
                  >
                    {departments.map((dept) => (
                      <Option key={dept.id} value={dept.id}>
                        <Space>
                          <BankOutlined />
                          {dept.departmentName}
                          {dept.manager && (
                            <Tag color="blue" className="ml-2">
                              {t('employees.manager')}: {dept.manager.fullName}
                            </Tag>
                          )}
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                {showManagerWarning && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 -mt-2 mb-2">
                    <div className="flex items-start gap-2">
                      <SafetyCertificateOutlined className="text-red-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-700 dark:text-red-400 m-0">
                          {t('employees.form.managerAlreadyExists')}
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400 m-0 mt-1">
                          {t('employees.form.managerWarning', { manager: selectedDeptManager.fullName })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <Form.Item
                  label={
                    <span className="flex items-center gap-2 font-medium">
                      <BankOutlined className="text-green-500" />
                      {t('employees.form.department')}
                    </span>
                  }
                  name="department"
                >
                  <Input
                    prefix={<BankOutlined className="text-gray-400" />}
                    value={userDepartment || t('employees.form.yourDepartment')}
                    disabled
                    size="large"
                    placeholder={userDepartment || t('employees.form.yourDepartment')}
                    className="bg-gray-100 dark:bg-gray-800 rounded-lg"
                  />
                </Form.Item>
                <p className="text-xs text-blue-600 dark:text-blue-400 -mt-2 flex items-center gap-1">
                  <SafetyCertificateOutlined />
                  {t('employees.form.departmentAutoAssign')}
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
                    {t('employees.form.role')}
                  </span>
                }
                name="role"
                rules={[{ required: true, message: t('employees.form.roleRequired') }]}
              >
                <Select 
                  placeholder={t('employees.form.rolePlaceholder')} 
                  size="large" 
                  onChange={handleRoleChange}
                  className="rounded-lg"
                  suffixIcon={<TeamOutlined className="text-gray-400" />}
                >
                  <Option value="ROLE_ADMIN">
                    <Space>
                      <SafetyCertificateOutlined className="text-red-500" />
                      {t('employees.form.admin')}
                    </Space>
                  </Option>
                  <Option value="ROLE_MANAGER">
                    <Space>
                      <TeamOutlined className="text-blue-500" />
                      {t('employees.form.manager')}
                    </Space>
                  </Option>
                  <Option value="ROLE_EMPLOYEE">
                    <Space>
                      <UserOutlined className="text-green-500" />
                      {t('employees.form.employee')}
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
                      {t('employees.form.role')}
                    </span>
                  }
                  name="role"
                >
                  <Input
                    prefix={<UserOutlined className="text-gray-400" />}
                    value={t('employees.form.employee')}
                    disabled
                    size="large"
                    placeholder={t('employees.form.employee')}
                    className="bg-gray-100 dark:bg-gray-800 rounded-lg"
                  />
                </Form.Item>
                <p className="text-xs text-blue-600 dark:text-blue-400 -mt-2 flex items-center gap-1">
                  <SafetyCertificateOutlined />
                  {t('employees.form.employeeAutoRole')}
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
              {t('employees.formSections.contactInformation')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 m-0">
              {t('employees.formSections.contactInformationDesc')}
            </p>
          </div>
        </div>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={
                <span className="flex items-center gap-2 font-medium">
                  <MailOutlined className="text-purple-500" />
                  {t('employees.form.emailAddress')}
                </span>
              }
              name="email"
              rules={[
                { type: 'email', message: t('employees.form.emailInvalid') }
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-gray-400" />}
                placeholder={t('employees.form.emailPlaceholder')}
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
                  {t('employees.form.phoneNumber')}
                </span>
              }
              name="phone"
            >
              <Input
                prefix={<PhoneOutlined className="text-gray-400" />}
                placeholder={t('employees.form.phonePlaceholder')}
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
                  {t('employees.form.dateOfBirth')}
                </span>
              }
              name="dateOfBirth"
            >
              <DatePicker
                style={{ width: '100%' }}
                size="large"
                placeholder={t('employees.form.dateOfBirthPlaceholder')}
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
                  {t('employees.form.gender')}
                </span>
              }
              name="gender"
              rules={[{ required: true, message: t('employees.form.genderRequired') }]}
            >
              <Select placeholder={t('employees.form.genderPlaceholder')} size="large" className="rounded-lg">
                <Option value="Male">
                  <Space>
                    <ManOutlined className="text-blue-500" />
                    {t('employees.form.male')}
                  </Space>
                </Option>
                <Option value="Female">
                  <Space>
                    <WomanOutlined className="text-pink-500" />
                    {t('employees.form.female')}
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
                  {t('employees.form.maritalStatus')}
                </span>
              }
              name="maritalStatus"
            >
              <Select placeholder={t('employees.form.maritalStatusPlaceholder')} size="large" allowClear className="rounded-lg">
                <Option value="Single">
                  <Space>
                    <UserOutlined />
                    {t('employees.form.single')}
                  </Space>
                </Option>
                <Option value="Married">
                  <Space>
                    <HeartOutlined className="text-red-500" />
                    {t('employees.form.married')}
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
                  {t('employees.form.address')}
                </span>
              }
              name="address"
            >
              <Input
                prefix={<HomeOutlined className="text-gray-400" />}
                placeholder={t('employees.form.addressPlaceholder')}
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
                  {t('employees.form.city')}
                </span>
              }
              name="city"
            >
              <Input
                prefix={<EnvironmentOutlined className="text-gray-400" />}
                placeholder={t('employees.form.cityPlaceholder')}
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
                  {t('employees.form.country')}
                </span>
              }
              name="country"
            >
              <Input
                prefix={<GlobalOutlined className="text-gray-400" />}
                placeholder={t('employees.form.countryPlaceholder')}
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
              {t('employees.formSections.emergencyContact')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 m-0">
              {t('employees.formSections.emergencyContactDesc')}
            </p>
          </div>
        </div>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={
                <span className="flex items-center gap-2 font-medium">
                  <ContactsOutlined className="text-red-500" />
                  {t('employees.form.emergencyContactName')}
                </span>
              }
              name="emergencyContact"
            >
              <Input 
                prefix={<ContactsOutlined className="text-gray-400" />}
                placeholder={t('employees.form.emergencyContactNamePlaceholder')}
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
                  {t('employees.form.emergencyContactPhone')}
                </span>
              }
              name="emergencyPhone"
            >
              <Input
                prefix={<PhoneOutlined className="text-gray-400" />}
                placeholder={t('employees.form.emergencyContactPhonePlaceholder')}
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
          {t('employees.form.cancel')}
        </Button>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={loading}
          className="rounded-lg"
          icon={<SaveOutlined />}
        >
          {isEditMode ? t('employees.form.updateEmployee') : t('employees.form.createEmployee')}
        </Button>
      </div>
    </Form>
  )
}
