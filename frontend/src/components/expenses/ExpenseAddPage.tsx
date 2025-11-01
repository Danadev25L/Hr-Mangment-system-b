'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Form, Input, InputNumber, DatePicker, Button, Card, Select, message, Typography } from 'antd'
import { DollarOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons'
import apiClient from '@/lib/api'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Title } = Typography

interface ExpenseAddPageProps {
  role: 'admin' | 'manager'
}

export default function ExpenseAddPage({ role }: ExpenseAddPageProps) {
  const router = useRouter()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  // Fetch departments for admin
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiClient.getDepartments(),
    enabled: role === 'admin',
  })

  const createExpenseMutation = useMutation({
    mutationFn: (data: any) => apiClient.createExpense(data),
    onSuccess: () => {
      message.success('Expense created successfully')
      router.push(`/${role}/expenses`)
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to create expense')
      setLoading(false)
    },
  })

  const handleSubmit = async (values: any) => {
    setLoading(true)
    
    const expenseData = {
      itemName: values.itemName,
      reason: values.reason,
      amount: values.amount,
      date: values.date.toISOString(),
      ...(role === 'admin' && { departmentId: values.departmentId || null }),
    }

    createExpenseMutation.mutate(expenseData)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <div className="mb-6">
          <Title level={2} className="!mb-2">
            <DollarOutlined className="mr-2" />
            Add New Expense
          </Title>
          <p className="text-gray-500">
            {role === 'admin'
              ? 'Create a new expense for any department or company-wide'
              : 'Create a new expense for your department'}
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            date: dayjs(),
          }}
        >
          {role === 'admin' && (
            <Form.Item
              label="Department"
              name="departmentId"
              rules={[{ required: true, message: 'Please select a department' }]}
              tooltip="Select a specific department or 'Company-wide' for general expenses"
            >
              <Select
                placeholder="Select department"
                size="large"
                showSearch
                optionFilterProp="children"
              >
                <Select.Option value={0}>Company-wide</Select.Option>
                {departmentsData?.map((dept: any) => (
                  <Select.Option key={dept.id} value={dept.id}>
                    {dept.departmentName}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            label="Expense Item Name"
            name="itemName"
            rules={[
              { required: true, message: 'Please enter the item name' },
              { max: 200, message: 'Item name cannot exceed 200 characters' },
            ]}
          >
            <Input
              placeholder="e.g., Office Supplies, Travel Ticket, Equipment"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Amount"
            name="amount"
            rules={[
              { required: true, message: 'Please enter the amount' },
              { type: 'number', min: 0.01, message: 'Amount must be greater than 0' },
            ]}
          >
            <InputNumber
              prefix="$"
              placeholder="0.00"
              size="large"
              className="w-full"
              precision={2}
              min={0}
            />
          </Form.Item>

          <Form.Item
            label="Date"
            name="date"
            rules={[{ required: true, message: 'Please select the date' }]}
          >
            <DatePicker
              size="large"
              className="w-full"
              format="YYYY-MM-DD"
              disabledDate={(current) => current && current > dayjs().endOf('day')}
            />
          </Form.Item>

          <Form.Item
            label="Description / Reason"
            name="reason"
            rules={[
              { max: 500, message: 'Description cannot exceed 500 characters' },
            ]}
          >
            <TextArea
              placeholder="Provide additional details about this expense..."
              rows={4}
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item>
            <div className="flex gap-3">
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
                size="large"
              >
                Create Expense
              </Button>
              <Button
                icon={<CloseOutlined />}
                onClick={() => router.push(`/${role}/expenses`)}
                size="large"
              >
                Cancel
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
