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
  Spin,
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
import { useRouter, useParams } from 'next/navigation'
import dayjs from 'dayjs'
import { EnhancedCard, EnhancedButton } from '@/components/ui'
import { ExpensesIllustration } from '@/components/ui/illustrations'

const { TextArea } = Input

interface ExpenseEditPageProps {
  role: 'admin' | 'manager'
}

export function ExpenseEditPage({ role }: ExpenseEditPageProps) {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const queryClient = useQueryClient()
  const [form] = Form.useForm()

  const basePath = role === 'admin' ? '/admin' : '/manager'
  const listPath = `${basePath}/expenses`
  const viewPath = `${basePath}/expenses/${id}`
  const dashboardPath = `${basePath}/dashboard`

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
      message.success('Expense updated successfully')
      queryClient.invalidateQueries({ queryKey: ['expense', id] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      router.push(viewPath)
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to update expense')
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
        <Spin size="large" />
      </div>
    )
  }

  if (!expenseData) {
    return <div className="text-center text-gray-500">Expense not found</div>
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
                <WalletOutlined />
                <span>Expenses</span>
              </Space>
            ),
            href: listPath,
          },
          {
            title: 'Edit Expense',
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
                Edit Expense
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Update the expense details below
              </p>
            </div>
          </div>
          <EnhancedButton
            variant="ghost"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push(listPath)}
          >
            Back to Expenses
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
                  Basic Information
                </h3>
              </div>
              <Form.Item
                label="Item Name"
                name="itemName"
                rules={[
                  { required: true, message: 'Please enter item name' },
                  { max: 255, message: 'Item name cannot exceed 255 characters' },
                ]}
              >
                <Input 
                  placeholder="e.g., Office Supplies, Travel Expenses"
                  prefix={<FileTextOutlined />}
                />
              </Form.Item>

              <Form.Item
                label="Amount"
                name="amount"
                rules={[
                  { required: true, message: 'Please enter amount' },
                  { 
                    type: 'number', 
                    min: 0.01, 
                    message: 'Amount must be greater than 0' 
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
                label="Expense Date"
                name="date"
                rules={[
                  { required: true, message: 'Please select expense date' },
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
                  Department & Details
                </h3>
              </div>
              {role === 'admin' && (
                <Form.Item
                  label="Department"
                  name="departmentId"
                  rules={[
                    { required: true, message: 'Please select a department' },
                  ]}
                >
                  <Select
                    placeholder="Select Department"
                    loading={isLoadingDepartments}
                    suffixIcon={<TeamOutlined />}
                    options={[
                      { label: 'Company-wide', value: 0 },
                      ...(departments?.map((dept: any) => ({
                        label: dept.departmentName,
                        value: dept.id,
                      })) || []),
                    ]}
                  />
                </Form.Item>
              )}

              <Form.Item
                label="Reason/Description"
                name="reason"
                rules={[
                  { required: true, message: 'Please enter reason for expense' },
                  { max: 1000, message: 'Reason cannot exceed 1000 characters' },
                ]}
              >
                <TextArea
                  rows={role === 'admin' ? 8 : 12}
                  placeholder="Provide a detailed description of the expense..."
                  showCount
                  maxLength={1000}
                />
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
              loading={updateExpenseMutation.isPending}
            >
              Save Changes
            </EnhancedButton>
          </div>
        </EnhancedCard>
      </Form>
    </div>
  )
}
