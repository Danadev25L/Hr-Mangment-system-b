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
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { useRouter, useParams } from 'next/navigation'
import dayjs from 'dayjs'

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
              <span className="flex items-center cursor-pointer" onClick={() => router.push(dashboardPath)}>
                <HomeOutlined className="mr-1" />
                Dashboard
              </span>
            ),
          },
          {
            title: (
              <span className="cursor-pointer" onClick={() => router.push(listPath)}>
                Expenses
              </span>
            ),
          },
          {
            title: (
              <span className="cursor-pointer" onClick={() => router.push(viewPath)}>
                View Details
              </span>
            ),
          },
          {
            title: 'Edit',
          },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Edit Expense
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Update expense information
          </p>
        </div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push(viewPath)}>
          Cancel
        </Button>
      </div>

      {/* Form */}
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
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
                  prefix={<DollarOutlined />}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
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
                  prefix="$"
                  style={{ width: '100%' }}
                  placeholder="0.00"
                  precision={2}
                  min={0.01}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
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
                  disabledDate={(current) => current && current > dayjs().endOf('day')}
                />
              </Form.Item>
            </Col>

            {role === 'admin' && (
              <Col xs={24} md={12}>
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
                    options={[
                      { label: 'Company-wide', value: 0 },
                      ...(departments?.map((dept: any) => ({
                        label: dept.departmentName,
                        value: dept.id,
                      })) || []),
                    ]}
                  />
                </Form.Item>
              </Col>
            )}

            <Col xs={24}>
              <Form.Item
                label="Reason/Description"
                name="reason"
                rules={[
                  { required: true, message: 'Please enter reason for expense' },
                  { max: 1000, message: 'Reason cannot exceed 1000 characters' },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Provide a detailed description of the expense..."
                  showCount
                  maxLength={1000}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={updateExpenseMutation.isPending}
              >
                Save Changes
              </Button>
              <Button onClick={() => router.push(viewPath)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
