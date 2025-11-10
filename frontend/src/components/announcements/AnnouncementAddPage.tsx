'use client'

import { useState, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  Form,
  Input,
  message,
  Row,
  Col,
  DatePicker,
  Select,
  Switch,
  Space,
} from 'antd'
import {
  PlusOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import dayjs from 'dayjs'
import {
  PageHeader,
  EnhancedButton,
  EnhancedCard,
} from '@/components/ui'
import { AnnouncementsIllustration } from '@/components/ui/illustrations/AnnouncementsIllustration'

const { TextArea } = Input

interface AnnouncementAddPageProps {
  role: 'admin' | 'manager'
  title: string
  description: string
}

export function AnnouncementAddPage({ role, title, description }: AnnouncementAddPageProps) {
  const locale = useLocale()
  const t = useTranslations()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null)
  const [isCompanyWide, setIsCompanyWide] = useState(false)
  const isRTL = locale === 'ar' || locale === 'ku'

  const basePath = role === 'admin' ? '/admin/announcements' : '/manager/announcements'

  const handleNavigation = (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path
    }
  }

  // Fetch departments
  const { data: departments, isLoading: isLoadingDepartments } = useQuery<any>({
    queryKey: ['departments'],
    queryFn: () => apiClient.getDepartments(),
  })

  // Fetch users based on selected department (for admin)
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users-for-announcements', selectedDepartment],
    queryFn: () => apiClient.getUsersForApplications(),
    enabled: role === 'admin' && selectedDepartment !== null,
  })

  // Fetch manager's department users (for manager)
  const { data: managerUsers, isLoading: isLoadingManagerUsers } = useQuery({
    queryKey: ['manager-users-for-announcements'],
    queryFn: () => apiClient.getUsersForApplications(),
    enabled: role === 'manager',
  })

  // Filter users by selected department (for admin)
  const filteredUsers = useMemo(() => {
    if (role === 'manager') {
      const usersList = Array.isArray(managerUsers) ? managerUsers : managerUsers?.data || []
      return usersList
    }
    
    if (!users || !selectedDepartment || isCompanyWide) return []
    const usersList = Array.isArray(users) ? users : users?.data || []
    return usersList.filter((user: any) => user.departmentId === selectedDepartment)
  }, [users, managerUsers, selectedDepartment, role, isCompanyWide])

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: (values: any) => apiClient.createAnnouncement(values),
    onSuccess: () => {
      message.success(t('announcements.createSuccess'))
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      handleNavigation(`/${locale}${basePath}`)
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || t('announcements.createError'))
    },
  })

  const handleSubmit = async (values: any) => {
    const payload = {
      ...values,
      date: values.date.format('YYYY-MM-DD'),
      departmentId: isCompanyWide ? null : (values.departmentId || null),
      recipientUserIds: values.recipientUserIds || [],
      isActive: values.isActive !== undefined ? values.isActive : true,
    }
    createAnnouncementMutation.mutate(payload)
  }

  const handleDepartmentChange = (value: number) => {
    setSelectedDepartment(value)
    form.setFieldsValue({ recipientUserIds: undefined })
  }

  const handleCompanyWideChange = (checked: boolean) => {
    setIsCompanyWide(checked)
    if (checked) {
      form.setFieldsValue({ 
        departmentId: undefined,
        recipientUserIds: undefined 
      })
      setSelectedDepartment(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        icon={<AnnouncementsIllustration className="w-20 h-20" />}
        gradient="amber"
        action={
          <EnhancedButton
            variant="ghost"
            icon={<ArrowLeftOutlined />}
            onClick={() => handleNavigation(`/${locale}${basePath}`)}
          >
            {t('common.cancel')}
          </EnhancedButton>
        }
      />

      {/* Announcement Form */}
      <EnhancedCard>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            isActive: true,
            date: dayjs(),
          }}
        >
          {/* Admin: Company-wide or Department selection */}
          {role === 'admin' && (
            <>
              <Form.Item
                label={t('announcements.scope')}
                tooltip={t('announcements.scopeTooltip')}
              >
                <Space direction={isRTL ? 'horizontal' : 'horizontal'}>
                  <span>{t('announcements.departmentSpecific')}</span>
                  <Switch 
                    checked={isCompanyWide}
                    onChange={handleCompanyWideChange}
                  />
                  <span>{t('announcements.companyWide')}</span>
                </Space>
              </Form.Item>

              {!isCompanyWide && (
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="departmentId"
                      label={t('announcements.department')}
                      rules={[{ required: !isCompanyWide, message: t('announcements.departmentRequired') }]}
                    >
                      <Select
                        placeholder={t('announcements.selectDepartment')}
                        loading={isLoadingDepartments}
                        onChange={handleDepartmentChange}
                        showSearch
                        filterOption={(input, option) =>
                          (option?.children as unknown as string)
                            ?.toLowerCase()
                            .includes(input.toLowerCase())
                        }
                      >
                        {(Array.isArray(departments) ? departments : departments?.data || []).map((dept: any) => (
                          <Select.Option key={dept.id} value={dept.id}>
                            {dept.departmentName || dept.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              )}
            </>
          )}

          {/* Recipient Selection (optional) */}
          {((role === 'admin' && selectedDepartment && !isCompanyWide) || role === 'manager') && (
            <Form.Item
              name="recipientUserIds"
              label={t('announcements.recipients')}
              tooltip={t('announcements.recipientsTooltip')}
            >
              <Select
                mode="multiple"
                placeholder={t('announcements.selectRecipients')}
                loading={role === 'admin' ? isLoadingUsers : isLoadingManagerUsers}
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
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="title"
                label={t('announcements.announcementTitle')}
                rules={[
                  { required: true, message: t('announcements.titleRequired') },
                  { max: 255, message: t('announcements.titleMaxLength') },
                ]}
              >
                <Input placeholder={t('announcements.titlePlaceholder')} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="date"
                label={t('announcements.date')}
                rules={[{ required: true, message: t('announcements.dateRequired') }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label={t('announcements.description')}
            rules={[
              { required: true, message: t('announcements.descriptionRequired') },
              { max: 2000, message: t('announcements.descriptionMaxLength') },
            ]}
          >
            <TextArea
              rows={6}
              placeholder={t('announcements.descriptionPlaceholder')}
              showCount
              maxLength={2000}
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label={t('announcements.status')}
            valuePropName="checked"
          >
            <Switch 
              checkedChildren={t('announcements.active')} 
              unCheckedChildren={t('announcements.inactive')} 
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <EnhancedButton
                variant="primary"
                htmlType="submit"
                icon={<PlusOutlined />}
                loading={createAnnouncementMutation.isPending}
              >
                {t('announcements.createAnnouncement')}
              </EnhancedButton>
              <EnhancedButton 
                variant="ghost"
                onClick={() => handleNavigation(`/${locale}${basePath}`)}
              >
                {t('common.cancel')}
              </EnhancedButton>
            </Space>
          </Form.Item>
        </Form>
      </EnhancedCard>
    </div>
  )
}
