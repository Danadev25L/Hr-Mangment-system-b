'use client'

import React, { useState, useMemo } from 'react'
import {
  Form,
  Input,
  message,
  Row,
  Col,
  Space,
  DatePicker,
  Select,
  Tag,
  Divider,
  Alert,
  Modal,
} from 'antd'
import {
  PlusOutlined,
  ArrowLeftOutlined,
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
import { useLocale, useTranslations } from 'next-intl'
import dayjs from 'dayjs'
import {
  PageHeader,
  EnhancedCard,
  EnhancedButton,
} from '@/components/ui'
import { ApplicationsIllustration } from '@/components/ui/illustrations/ApplicationsIllustration'

const { TextArea } = Input

interface ApplicationAddPageProps {
  role: 'admin' | 'manager' | 'employee'
}

export function ApplicationAddPage({ role }: ApplicationAddPageProps) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('applicationForm')
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null)

  const basePath = 
    role === 'admin' ? '/admin/applications' : 
    role === 'manager' ? '/manager/applications' : 
    '/employee/applications'
  const listPath = `/${locale}${basePath}`

  const handleNavigation = (path: string) => {
    if (typeof window !== 'undefined') {
      router.push(path)
    }
  }

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
    onSuccess: (response) => {
      message.success({
        content: (
          <div>
            <div className="font-semibold">✅ {t('createdSuccessfully')}</div>
            <div className="text-xs mt-1">{response.message || t('submittedForApproval')}</div>
          </div>
        ),
        duration: 4,
      })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      form.resetFields()
      setTimeout(() => handleNavigation(listPath), 1000)
    },
    onError: (error: any) => {
      console.error('Error creating application:', error)
      const errorMessage = error.response?.data?.message || 'Failed to create application'
      
      // Handle specific error cases
      if (errorMessage.includes('End date must be after start date') || 
          errorMessage.includes('endDate') || 
          errorMessage.includes('startDate')) {
        message.error({
          content: (
            <div>
              <div className="font-semibold">📅 {t('invalidDateRange')}</div>
              <div>{t('endDateAfterStart')}</div>
              <div className="text-xs mt-1">{t('checkDateSelection')}</div>
            </div>
          ),
          duration: 5,
        })
      } else if (errorMessage.includes('Missing required fields')) {
        message.error({
          content: (
            <div>
              <div className="font-semibold">⚠️ {t('missingRequiredInfo')}</div>
              <div>{errorMessage}</div>
              <div className="text-xs mt-1">{t('fillAllRequired')}</div>
            </div>
          ),
          duration: 5,
        })
      } else if (errorMessage.includes('Invalid date format')) {
        message.error({
          content: (
            <div>
              <div className="font-semibold">❌ {t('invalidDateFormat')}</div>
              <div>{t('provideValidDates')}</div>
            </div>
          ),
          duration: 4,
        })
      } else if (errorMessage.includes('already has a pending application') || 
                 errorMessage.includes('overlapping')) {
        message.error({
          content: (
            <div>
              <div className="font-semibold">🔄 {t('conflictingApplication')}</div>
              <div>{errorMessage}</div>
              <div className="text-xs mt-1">{t('checkExistingApplications')}</div>
            </div>
          ),
          duration: 6,
        })
      } else if (errorMessage.includes('Forbidden') || errorMessage.includes('permission')) {
        message.error({
          content: (
            <div>
              <div className="font-semibold">🚫 {t('accessDenied')}</div>
              <div>{errorMessage}</div>
            </div>
          ),
          duration: 5,
        })
      } else if (errorMessage.includes('Cannot be empty') || errorMessage.includes('required')) {
        message.error({
          content: (
            <div>
              <div className="font-semibold">⚠️ {t('requiredFieldMissing')}</div>
              <div>{t('fillRequiredBeforeSubmit')}</div>
            </div>
          ),
          duration: 4,
        })
      } else {
        message.error({
          content: (
            <div>
              <div className="font-semibold">❌ {t('errorCreatingApplication')}</div>
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
              <div className="font-semibold">⚠️ {t('missingDates')}</div>
              <div>{t('bothDatesRequired')}</div>
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
              <div className="font-semibold">📅 {t('invalidDateRange')}</div>
              <div>{t('endDateBeforeStart')}</div>
              <div className="text-xs mt-1">
                Start: {startDate.format('MMM DD, YYYY')} | End: {endDate.format('MMM DD, YYYY')}
              </div>
            </div>
          ),
          duration: 5,
        })
        return
      }

      // Check if dates are too far in the past
      const today = dayjs()
      if (startDate.isBefore(today.subtract(30, 'days'), 'day')) {
        Modal.confirm({
          title: `⚠️ ${t('oldDateWarning')}`,
          content: `${t('oldDateConfirm').replace('{date}', startDate.format('MMM DD, YYYY'))}`,
          okText: t('yesContinue'),
          cancelText: t('common.cancel'),
          onOk: () => {
            submitApplication(values)
          },
        })
        return
      }

      submitApplication(values)
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      message.error(t('unexpectedError'))
    }
  }

  const submitApplication = (values: any) => {
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
      {/* Header */}
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        icon={<ApplicationsIllustration className="w-20 h-20" />}
        gradient="cyan"
        action={
          <EnhancedButton
            variant="secondary"
            icon={<ArrowLeftOutlined />}
            onClick={() => handleNavigation(listPath)}
          >
            {t('backToApplications')}
          </EnhancedButton>
        }
      />

      {/* Form Card */}
      <EnhancedCard className="shadow-md">
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
            <EnhancedCard className="mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700 border-l-4 border-l-blue-500">
              <Divider orientation="left">
                <Space>
                  <TeamOutlined className="text-blue-600" />
                  <span className="text-gray-700 dark:text-gray-300 font-semibold">{t('selectEmployeeSection')}</span>
                </Space>
              </Divider>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="departmentFilter"
                    label={
                      <span className="flex items-center gap-2 font-medium">
                        <BankOutlined className="text-blue-600" />
                        {t('department')}
                      </span>
                    }
                    rules={[{ required: true, message: t('departmentRequired') }]}
                  >
                    <Select
                      placeholder={t('selectDepartment')}
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
                        {t('employee')}
                      </span>
                    }
                    rules={[{ required: true, message: t('employeeRequired') }]}
                  >
                    <Select
                      placeholder={selectedDepartment ? t('selectEmployee') : t('selectEmployeeFirst')}
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
            </EnhancedCard>
          )}

          {role === 'manager' && (
            <EnhancedCard className="mb-6 bg-gradient-to-r from-green-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 border-l-4 border-l-green-500">
              <Alert
                message={t('applicationCreation')}
                description={t('managerApplicationDescription')}
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
                        {t('createApplicationFor')}
                      </span>
                    }
                    rules={[{ required: true, message: t('selectUserRequired') }]}
                    tooltip={t('selectYourselfOrEmployee')}
                  >
                    <Select
                      placeholder={t('selectYourselfOrEmployee')}
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
            </EnhancedCard>
          )}

          {role === 'employee' && (
            <EnhancedCard className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 border-l-4 border-l-purple-500">
              <Alert
                message={t('submitYourApplication')}
                description={t('employeeApplicationDescription')}
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                className="mb-2"
              />
            </EnhancedCard>
          )}

          <Divider orientation="left">
            <Space>
              <FileTextOutlined className="text-cyan-600" />
              <span className="text-gray-700 dark:text-gray-300 font-semibold">{t('applicationDetails')}</span>
            </Space>
          </Divider>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="title"
                label={
                  <span className="flex items-center gap-2 font-medium">
                    <FileTextOutlined className="text-cyan-600" />
                    {t('applicationTitle')}
                  </span>
                }
                rules={[
                  { required: true, message: t('titleRequired') },
                  { max: 200, message: t('titleMaxLength') },
                ]}
              >
                <Input 
                  placeholder={t('titlePlaceholder')}
                  size="large"
                  className="rounded-lg"
                  prefix={<FileTextOutlined className="text-gray-400" />}
                  suffix={<Tag color="blue">{t('maxChars')}</Tag>}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="applicationType"
                label={
                  <span className="flex items-center gap-2 font-medium">
                    <CheckCircleOutlined className="text-cyan-600" />
                    {t('applicationType')}
                  </span>
                }
                rules={[{ required: true, message: t('typeRequired') }]}
              >
                <Select 
                  placeholder={t('selectType')}
                  size="large"
                  className="rounded-lg"
                >
                  <Select.Option value="leave">
                    <Space>
                      <CalendarOutlined className="text-blue-500" />
                      {t('leave')}
                    </Space>
                  </Select.Option>
                  <Select.Option value="overtime">
                    <Space>
                      <ClockCircleOutlined className="text-orange-500" />
                      {t('overtime')}
                    </Space>
                  </Select.Option>
                  <Select.Option value="remote">
                    <Space>
                      <EnvironmentOutlined className="text-green-500" />
                      {t('remoteWork')}
                    </Space>
                  </Select.Option>
                  <Select.Option value="other">
                    <Space>
                      <FileTextOutlined className="text-gray-500" />
                      {t('other')}
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
                    {t('priorityLevel')}
                  </span>
                }
                rules={[{ required: true, message: t('priorityRequired') }]}
                tooltip={t('selectUrgencyLevel')}
              >
                <Select 
                  placeholder={t('selectPriority')}
                  size="large"
                  className="rounded-lg"
                >
                  <Select.Option value="low">
                    <Space>
                      <Tag color="default">{t('low')}</Tag>
                      {t('canWait')}
                    </Space>
                  </Select.Option>
                  <Select.Option value="medium">
                    <Space>
                      <Tag color="blue">{t('medium')}</Tag>
                      {t('normalPriority')}
                    </Space>
                  </Select.Option>
                  <Select.Option value="high">
                    <Space>
                      <Tag color="orange">{t('high')}</Tag>
                      {t('important')}
                    </Space>
                  </Select.Option>
                  <Select.Option value="urgent">
                    <Space>
                      <Tag color="red">{t('urgent')}</Tag>
                      <ThunderboltOutlined className="text-red-500" />
                      {t('immediateAttention')}
                    </Space>
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <div className="h-full flex items-center">
                <Alert
                  message={t('priorityGuide')}
                  description={t('priorityGuideDescription')}
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
              <span className="text-gray-700 dark:text-gray-300 font-semibold">{t('dateRange')}</span>
            </Space>
          </Divider>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="startDate"
                label={
                  <span className="flex items-center gap-2 font-medium">
                    <CalendarOutlined className="text-cyan-600" />
                    {t('startDate')}
                  </span>
                }
                rules={[{ required: true, message: t('startDateRequired') }]}
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
                    {t('endDate')}
                  </span>
                }
                rules={[
                  { required: true, message: t('endDateRequired') },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || !getFieldValue('startDate') || value >= getFieldValue('startDate')) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error(t('endDateAfterStart')))
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
              <span className="text-gray-700 dark:text-gray-300 font-semibold">{t('reasonJustification')}</span>
            </Space>
          </Divider>

          <Form.Item
            name="reason"
            label={
              <span className="flex items-center gap-2 font-medium">
                <FileTextOutlined className="text-cyan-600" />
                {t('reasonForApplication')}
              </span>
            }
            rules={[
              { required: true, message: t('reasonRequired') },
              { max: 500, message: t('reasonMaxLength') },
            ]}
            tooltip={t('provideExplanation')}
          >
            <TextArea
              rows={5}
              placeholder={t('reasonPlaceholder')}
              showCount
              maxLength={500}
              className="rounded-lg"
            />
          </Form.Item>

          <Divider />

          <Form.Item className="mb-0">
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <EnhancedButton
                variant="secondary"
                onClick={() => handleNavigation(listPath)}
                icon={<ArrowLeftOutlined />}
              >
                {t('cancel')}
              </EnhancedButton>
              <EnhancedButton
                variant="primary"
                htmlType="submit"
                icon={<PlusOutlined />}
                loading={createApplicationMutation.isPending}
              >
                {t('createApplication')}
              </EnhancedButton>
            </div>
          </Form.Item>
        </Form>
      </EnhancedCard>
    </div>
  )
}
