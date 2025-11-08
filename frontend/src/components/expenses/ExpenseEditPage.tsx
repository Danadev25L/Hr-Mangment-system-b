'use client'

import React, { useEffect } from 'react'
import {
  Card,
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Col,
  Breadcrumb,
  Space,
  DatePicker,
  Select,
} from 'antd'
import {
  DollarOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  HomeOutlined,
  FileTextOutlined,
  CalendarOutlined,
  WalletOutlined,
  TeamOutlined,
  EditOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import dayjs from 'dayjs'
import { EnhancedCard, EnhancedButton, CustomSpinner } from '@/components/ui'
import { ExpensesIllustration } from '@/components/ui/illustrations'

const { TextArea } = Input

interface ExpenseEditPageProps {
  role: 'admin' | 'manager'
}

export function ExpenseEditPage({ role }: ExpenseEditPageProps) {
  const t = useTranslations()
  const params = useParams()
  const locale = useLocale()
  const id = params.id as string
  const queryClient = useQueryClient()
  const [form] = Form.useForm()

  const basePath = role === 'admin' ? '/admin' : '/manager'
  const listPath = `/${locale}${basePath}/expenses`
  const viewPath = `/${locale}${basePath}/expenses/${id}`
  const dashboardPath = `/${locale}${basePath}/dashboard`

  // Navigate with locale support
  const handleNavigation = (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path
    }
  }

  // Fetch expense data
  const { data: expenseData, isLoading: isLoadingExpense } = useQuery({
    queryKey: ['expense', id],
    queryFn: () => apiClient.getExpense(id),
    enabled: !!id,
  })

  // Fetch departments for admin
  const { data: departments, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiClient.getDepartments(),
    enabled: role === 'admin',
  })

  // Set form initial values when data is loaded
  useEffect(() => {
    if (expenseData) {
      form.setFieldsValue({
        itemName: expenseData.itemName,
        amount: expenseData.amount,
        reason: expenseData.reason,
        date: dayjs(expenseData.date),
        departmentId: expenseData.departmentId === null ? 0 : expenseData.departmentId,
      })
    }
  }, [expenseData, form])

  // Update expense mutation
  const updateExpenseMutation = useMutation({
    mutationFn: (values: any) => apiClient.updateExpense(id, values),
    onSuccess: () => {
      message.success(t('expenses.updateSuccess'))
      queryClient.invalidateQueries({ queryKey: ['expense', id] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      handleNavigation(viewPath)
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || t('expenses.updateError'))
    },
  })

  const handleSubmit = async (values: any) => {
    const payload = {
      ...values,
      date: values.date.format('YYYY-MM-DD'),
      departmentId: values.departmentId === 0 ? null : values.departmentId,
    }
    updateExpenseMutation.mutate(payload)
  }

  if (isLoadingExpense) {
    return (
      <div className="flex items-center justify-center h-64">
        <CustomSpinner size="large" text={t('expenses.view.loading')} />
      </div>
    )
  }

  if (!expenseData) {
    return <div className="text-center text-gray-500">{t('expenses.view.notFound')}</div>
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
                <span>{t('common.dashboard')}</span>
              </Space>
            ),
            href: dashboardPath,
          },
          {
            title: (
              <Space>
                <WalletOutlined />
                <span>{t('expenses.title')}</span>
              </Space>
            ),
            href: listPath,
          },
          {
            title: t('expenses.editExpense'),
          },
        ]}
      />

      {/* Header */}
      <EnhancedCard>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="hidden md:block">
              <ExpensesIllustration className="w-20 h-20" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {t('expenses.editExpense')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('expenses.edit.subtitle')}
              </p>
            </div>
          </div>
          <EnhancedButton
            variant="ghost"
            icon={<ArrowLeftOutlined />}
            onClick={() => handleNavigation(listPath)}
          >
            {t('expenses.backToList')}
          </EnhancedButton>
        </div>
      </EnhancedCard>

      {/* Form */}
      <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <EnhancedCard>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileTextOutlined className="text-white text-lg" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t('expenses.form.basicInfo')}
                </h3>
              </div>
              <Form.Item
                label={t('expenses.form.itemName')}
                name="itemName"
                rules={[
                  { required: true, message: t('expenses.form.itemNameRequired') },
                  { max: 255, message: t('expenses.form.itemNameMaxLength') },
                ]}
              >
                <Input 
                  placeholder={t('expenses.form.itemNamePlaceholder')}
                  prefix={<FileTextOutlined />}
                />
              </Form.Item>

              <Form.Item
                label={t('expenses.amount')}
                name="amount"
                rules={[
                  { required: true, message: t('expenses.form.amountRequired') },
                  { 
                    type: 'number', 
                    min: 0.01, 
                    message: t('expenses.form.amountMin')
                  },
                ]}
              >
                <InputNumber
                  prefix={<DollarOutlined />}
                  style={{ width: '100%' }}
                  placeholder="0.00"
                  precision={2}
                  min={0.01}
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as any}
                />
              </Form.Item>

              <Form.Item
                label={t('expenses.view.expenseDate')}
                name="date"
                rules={[
                  { required: true, message: t('expenses.form.dateRequired') },
                ]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                  suffixIcon={<CalendarOutlined />}
                  disabledDate={(current) => current && current > dayjs().endOf('day')}
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
                  {t('expenses.form.departmentDetails')}
                </h3>
              </div>
              {role === 'admin' && (
                <Form.Item
                  label={t('expenses.department')}
                  name="departmentId"
                  rules={[
                    { required: true, message: t('expenses.form.departmentRequired') },
                  ]}
                >
                  <Select
                    placeholder={t('expenses.form.selectDepartment')}
                    loading={isLoadingDepartments}
                    suffixIcon={<TeamOutlined />}
                    options={[
                      { label: t('expenses.view.companyWide'), value: 0 },
                      ...(departments?.map((dept: any) => ({
                        label: dept.departmentName,
                        value: dept.id,
                      })) || []),
                    ]}
                  />
                </Form.Item>
              )}

              <Form.Item
                label={t('expenses.reason')}
                name="reason"
                rules={[
                  { required: true, message: t('expenses.form.reasonRequired') },
                  { max: 1000, message: t('expenses.form.reasonMaxLength') },
                ]}
              >
                <TextArea
                  rows={role === 'admin' ? 8 : 12}
                  placeholder={t('expenses.form.reasonPlaceholder')}
                  showCount
                  maxLength={1000}
                />
              </Form.Item>
            </EnhancedCard>
          </Col>
        </Row>

        <EnhancedCard>
          <div className="flex justify-end gap-4">
            <EnhancedButton variant="ghost" onClick={() => handleNavigation(listPath)}>
              {t('common.cancel')}
            </EnhancedButton>
            <EnhancedButton
              variant="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={updateExpenseMutation.isPending}
            >
              {t('expenses.saveChanges')}
            </EnhancedButton>
          </div>
        </EnhancedCard>
      </Form>
    </div>
  )
}
