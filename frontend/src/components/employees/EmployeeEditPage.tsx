'use client'

import React, { useEffect, useState } from 'react'
import {
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Row,
  Col,
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
import { useParams } from 'next/navigation'
import dayjs from 'dayjs'
import { useLocale, useTranslations } from 'next-intl'
import { EnhancedCard, EnhancedButton, PageHeader, CustomSpinner } from '@/components/ui'
import { EmployeesIllustration } from '@/components/ui/illustrations'

const { Option } = Select

interface EmployeeEditPageProps {
  role: 'admin' | 'manager'
}

export function EmployeeEditPage({ role }: EmployeeEditPageProps) {
  const params = useParams()
  const locale = useLocale()
  const t = useTranslations()
  const id = params.id as string
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const [selectedRole, setSelectedRole] = useState<string>('')

  const basePath = role === 'admin' ? '/admin' : '/manager'
  const listPath = `/${locale}${basePath}/employees`
  const dashboardPath = `/${locale}${basePath}/dashboard`
  const canEditRoleAndDepartment = role === 'admin'

  // Navigate with locale support
  const handleNavigation = (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path
    }
  }

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
      message.success(t('employees.editPage.updateSuccess'))
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', id] })
      queryClient.invalidateQueries({ queryKey: ['manager-employees'] })
      handleNavigation(listPath)
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || t('employees.editPage.updateFailed')

      // Enhanced error handling for specific scenarios
      if (errorMessage.includes('already has a manager')) {
        message.error({
          content: (
            <div>
              <strong>{t('employees.editPage.managerConflictTitle')}</strong>
              <br />
              {errorMessage}
              <br />
              <br />
              <strong>{t('employees.editPage.managerConflictSolutions')}</strong>
              <br />
              • {t('employees.editPage.managerConflictSolution1')}
              <br />
              • {t('employees.editPage.managerConflictSolution2')}
              <br />
              • {t('employees.editPage.managerConflictSolution3')}
            </div>
          ),
          duration: 8,
          style: { marginTop: '20vh' },
        })
      } else if (errorMessage.includes('Password must contain')) {
        message.error({
          content: (
            <div>
              <strong>{t('employees.editPage.passwordRequirementsTitle')}</strong>
              <br />
              {errorMessage}
              <br />
              <br />
              {t('employees.editPage.passwordRequirementsDesc')}
              <br />
              • {t('employees.editPage.passwordRequirement1')}
              <br />
              • {t('employees.editPage.passwordRequirement2')}
              <br />
              • {t('employees.editPage.passwordRequirement3')}
              <br />
              • {t('employees.editPage.passwordRequirement4')}
            </div>
          ),
          duration: 6,
        })
      } else if (errorMessage.includes('already exists')) {
        message.error({
          content: `${errorMessage}. ${t('employees.editPage.alreadyExistsError')}`,
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <CustomSpinner size="large" text={t('employees.editPage.loadingEmployee')} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={`${t('employees.editPage.title')} - ${userData?.data?.fullName || ''}`}
        description={
          canEditRoleAndDepartment
            ? t('employees.editPage.descriptionAdmin')
            : t('employees.editPage.descriptionManager')
        }
        icon={<EmployeesIllustration className="w-20 h-20" />}
        gradient="purple"
        action={
          <EnhancedButton
            variant="secondary"
            icon={<ArrowLeftOutlined />}
            onClick={() => handleNavigation(listPath)}
          >
            {role === 'admin' ? t('employees.editPage.backToEmployees') : t('employees.editPage.backToTeam')}
          </EnhancedButton>
        }
      />

      {/* Manager Alert */}
      {!canEditRoleAndDepartment && (
        <Alert
          message={t('employees.editPage.managerRestrictionsTitle')}
          description={t('employees.editPage.managerRestrictionsDesc')}
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t('employees.editPage.accountInformation')}
                </h3>
              </div>
                <Form.Item
                  name="fullName"
                  label={t('employees.form.fullName')}
                  rules={[{ required: true, message: t('employees.form.fullNameRequired') }]}
                >
                  <Input prefix={<UserOutlined />} placeholder={t('employees.form.fullNamePlaceholder')} />
                </Form.Item>

                <Form.Item
                  name="username"
                  label={t('employees.form.username')}
                  rules={[
                    { required: true, message: t('employees.form.usernameRequired') },
                    { min: 3, message: t('employees.form.usernameMinLength') },
                  ]}
                >
                  <Input prefix={<UserOutlined />} placeholder={t('employees.form.usernamePlaceholder')} />
                </Form.Item>

                <Form.Item
                  name="email"
                  label={t('employees.form.emailAddress')}
                  rules={[
                    { required: true, message: t('employees.form.emailRequired') },
                    { type: 'email', message: t('employees.form.emailInvalid') },
                  ]}
                >
                  <Input prefix={<MailOutlined />} placeholder={t('employees.form.emailPlaceholder')} />
                </Form.Item>

                <Form.Item
                  name="password"
                  label={t('employees.form.password')}
                  help={t('employees.editPage.passwordHelp')}
                  rules={[
                    { min: 8, message: t('employees.form.passwordMinLength') },
                    { max: 128, message: t('employees.form.passwordMaxLength') },
                    {
                      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()])[\w@$!%*?&^#()]+$/,
                      message: t('employees.form.passwordRequirements'),
                    },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder={t('employees.form.passwordPlaceholder')}
                    title={t('employees.form.passwordTitle')}
                  />
                </Form.Item>

                <Form.Item name="employeeCode" label={t('employees.form.employeeCode')}>
                  <Input
                    prefix={<IdcardOutlined />}
                    placeholder={t('employees.editPage.employeeCodeReadonly')}
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t('employees.editPage.jobAndDepartment')}
                  </h3>
                </div>
                {/* Role field - only for admin */}
                {canEditRoleAndDepartment && (
                  <Form.Item
                    name="role"
                    label={t('employees.form.role')}
                    rules={[{ required: true, message: t('employees.form.roleRequired') }]}
                  >
                    <Select placeholder={t('employees.form.rolePlaceholder')} onChange={handleRoleChange}>
                      <Option value="ROLE_ADMIN">{t('employees.form.admin')}</Option>
                      <Option value="ROLE_MANAGER">{t('employees.form.manager')}</Option>
                      <Option value="ROLE_EMPLOYEE">{t('employees.form.employee')}</Option>
                    </Select>
                  </Form.Item>
                )}

                <Form.Item name="jobTitle" label={t('employees.form.jobTitle')}>
                  <Input prefix={<UserOutlined />} placeholder={t('employees.form.jobTitlePlaceholder')} />
                </Form.Item>

                <Form.Item
                  name="departmentId"
                  label={
                    <span>
                      {t('employees.form.department')} {!canEditRoleAndDepartment && <LockOutlined className="ml-1" />}
                    </span>
                  }
                  rules={
                    canEditRoleAndDepartment && selectedRole !== 'ROLE_ADMIN'
                      ? [{ required: true, message: t('employees.form.departmentRequired') }]
                      : []
                  }
                >
                  <Select
                    placeholder={t('employees.form.departmentPlaceholder')}
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

                <Form.Item name="baseSalary" label={t('employees.form.baseSalary')}>
                  <InputNumber
                    prefix={<DollarOutlined />}
                    className="w-full"
                    placeholder={t('employees.form.baseSalaryPlaceholder')}
                    formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Item>

                <Form.Item name="employmentType" label={t('employees.form.employmentType')}>
                  <Select placeholder={t('employees.form.employmentTypePlaceholder')}>
                    <Option value="Full-time">{t('employees.form.fullTime')}</Option>
                    <Option value="Part-time">{t('employees.form.partTime')}</Option>
                    <Option value="Contract">{t('employees.form.contract')}</Option>
                    <Option value="Internship">{t('employees.form.internship')}</Option>
                  </Select>
                </Form.Item>

                <Form.Item name="workLocation" label={t('employees.form.workLocation')}>
                  <Select placeholder={t('employees.form.workLocationPlaceholder')}>
                    <Option value="Office">{t('employees.form.office')}</Option>
                    <Option value="Remote">{t('employees.form.remote')}</Option>
                    <Option value="Hybrid">{t('employees.form.hybrid')}</Option>
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t('employees.editPage.employmentDates')}
                  </h3>
                </div>
                <Form.Item
                  name="startDate"
                  label={t('employees.form.startDate')}
                  rules={[{ required: true, message: t('employees.form.startDateRequired') }]}
                >
                  <DatePicker style={{ width: '100%' }} placeholder={t('employees.form.startDatePlaceholder')} />
                </Form.Item>

                <Form.Item name="endDate" label={t('employees.form.endDate')}>
                  <DatePicker className="w-full" placeholder={t('employees.form.endDatePlaceholder')} />
                </Form.Item>
              </EnhancedCard>
            </Col>

            <Col xs={24} lg={12}>
              <EnhancedCard>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center">
                    <PhoneOutlined className="text-white text-lg" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t('employees.editPage.contactInformation')}
                  </h3>
                </div>
                <Form.Item name="phone" label={t('employees.form.phoneNumber')}>
                  <Input prefix={<PhoneOutlined />} placeholder={t('employees.form.phoneNumberPlaceholder')} />
                </Form.Item>

                <Form.Item name="address" label={t('employees.form.address')}>
                  <Input prefix={<EnvironmentOutlined />} placeholder={t('employees.form.addressPlaceholder')} />
                </Form.Item>

                <Form.Item name="city" label={t('employees.form.city')}>
                  <Input prefix={<EnvironmentOutlined />} placeholder={t('employees.form.cityPlaceholder')} />
                </Form.Item>

                <Form.Item name="country" label={t('employees.form.country')}>
                  <Input prefix={<GlobalOutlined />} placeholder={t('employees.form.countryPlaceholder')} />
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t('employees.editPage.personalInformationTitle')}
                  </h3>
                </div>

                <Form.Item name="dateOfBirth" label={t('employees.form.dateOfBirth')}>
                  <DatePicker className="w-full" placeholder={t('employees.form.dateOfBirthPlaceholder')} suffixIcon={<CalendarOutlined />} />
                </Form.Item>

                <Form.Item name="gender" label={t('employees.form.gender')}>
                  <Radio.Group>
                    <Radio value="Male">{t('employees.form.male')}</Radio>
                    <Radio value="Female">{t('employees.form.female')}</Radio>
                    <Radio value="Other">{t('employees.editPage.other')}</Radio>
                    <Radio value="Prefer not to say">{t('employees.editPage.preferNotToSay')}</Radio>
                  </Radio.Group>
                </Form.Item>

                <Form.Item name="maritalStatus" label={t('employees.form.maritalStatus')}>
                  <Select placeholder={t('employees.form.maritalStatusPlaceholder')} suffixIcon={<HeartOutlined />}>
                    <Option value="Single">{t('employees.form.single')}</Option>
                    <Option value="Married">{t('employees.form.married')}</Option>
                    <Option value="Divorced">{t('employees.editPage.divorced')}</Option>
                    <Option value="Widowed">{t('employees.editPage.widowed')}</Option>
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t('employees.editPage.emergencyContactTitle')}
                  </h3>
                </div>

                <Form.Item name="emergencyContact" label={t('employees.form.emergencyContactName')}>
                  <Input prefix={<UserOutlined />} placeholder={t('employees.form.emergencyContactNamePlaceholder')} />
                </Form.Item>

                <Form.Item name="emergencyPhone" label={t('employees.form.emergencyContactPhone')}>
                  <Input prefix={<PhoneOutlined />} placeholder={t('employees.form.emergencyContactPhonePlaceholder')} />
                </Form.Item>
              </EnhancedCard>
            </Col>
          </Row>

          <EnhancedCard>
            <div className="flex justify-end gap-4">
              <EnhancedButton variant="ghost" onClick={() => handleNavigation(listPath)}>
                {t('employees.form.cancel')}
              </EnhancedButton>
              <EnhancedButton
                variant="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={updateEmployeeMutation.isPending}
              >
                {t('employees.form.updateEmployee')}
              </EnhancedButton>
            </div>
          </EnhancedCard>
        </Form>
    </div>
  )
}
