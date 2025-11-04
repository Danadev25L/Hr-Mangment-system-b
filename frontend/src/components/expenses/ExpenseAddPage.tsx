'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Form, Input, InputNumber, DatePicker, Button, Card, Select, message, Typography, Space, Tag, Divider, Row, Col, Alert } from 'antd'
import { 
  DollarOutlined, 
  SaveOutlined, 
  CloseOutlined,
  BankOutlined,
  CalendarOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  CreditCardOutlined,
  WalletOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
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
      {/* Header Card */}
      <Card className="mb-6 shadow-lg border-t-4 border-t-emerald-500">
        <div className="flex items-center">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
            <WalletOutlined className="text-white text-2xl" />
          </div>
          <div className="flex-1">
            <Title level={2} className="!mb-1 !text-gray-900 dark:!text-gray-100">
              Add New Expense
            </Title>
            <p className="text-gray-500 dark:text-gray-400 m-0 flex items-center gap-2">
              <InfoCircleOutlined />
              {role === 'admin'
                ? 'Create a new expense for any department or company-wide'
                : 'Create a new expense for your department'}
            </p>
          </div>
          <div className="hidden md:flex gap-2">
            <Tag icon={<CheckCircleOutlined />} color="success">Quick Entry</Tag>
            <Tag icon={<DollarOutlined />} color="processing">Financial</Tag>
          </div>
        </div>
      </Card>

      {/* Form Card */}
      <Card className="shadow-lg">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            date: dayjs(),
          }}
        >
          {role === 'admin' && (
            <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border-l-4 border-l-blue-500">
              <Form.Item
                label={
                  <span className="flex items-center gap-2 font-medium text-base">
                    <BankOutlined className="text-blue-600" />
                    Department
                  </span>
                }
                name="departmentId"
                rules={[{ required: true, message: 'Please select a department' }]}
                tooltip="Select a specific department or 'Company-wide' for general expenses"
                className="mb-0"
              >
                <Select
                  placeholder="Select department"
                  size="large"
                  showSearch
                  optionFilterProp="children"
                  className="rounded-lg"
                  suffixIcon={<BankOutlined className="text-gray-400" />}
                >
                  <Select.Option value={0}>
                    <Space>
                      <BankOutlined className="text-purple-500" />
                      <span className="font-medium">Company-wide</span>
                      <Tag color="purple" className="ml-2">All Departments</Tag>
                    </Space>
                  </Select.Option>
                  {departmentsData?.map((dept: any) => (
                    <Select.Option key={dept.id} value={dept.id}>
                      <Space>
                        <BankOutlined className="text-blue-500" />
                        {dept.departmentName}
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Card>
          )}

          <Divider orientation="left">
            <Space>
              <ShoppingOutlined className="text-emerald-600" />
              <span className="text-gray-700 dark:text-gray-300 font-semibold">Expense Details</span>
            </Space>
          </Divider>

          <Row gutter={[24, 16]}>
            <Col xs={24} md={16}>
              <Form.Item
                label={
                  <span className="flex items-center gap-2 font-medium">
                    <ShoppingOutlined className="text-emerald-600" />
                    Expense Item Name
                  </span>
                }
                name="itemName"
                rules={[
                  { required: true, message: 'Please enter the item name' },
                  { max: 200, message: 'Item name cannot exceed 200 characters' },
                ]}
              >
                <Input
                  prefix={<ShoppingOutlined className="text-gray-400" />}
                  placeholder="e.g., Office Supplies, Travel Ticket, Equipment"
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label={
                  <span className="flex items-center gap-2 font-medium">
                    <DollarOutlined className="text-emerald-600" />
                    Amount
                  </span>
                }
                name="amount"
                rules={[
                  { required: true, message: 'Please enter the amount' },
                  { type: 'number', min: 0.01, message: 'Amount must be greater than 0' },
                ]}
                tooltip="Enter the expense amount in USD"
              >
                <InputNumber
                  prefix={<CreditCardOutlined className="text-gray-400" />}
                  placeholder="0.00"
                  size="large"
                  className="w-full rounded-lg"
                  precision={2}
                  min={0}
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as any}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <span className="flex items-center gap-2 font-medium">
                    <CalendarOutlined className="text-emerald-600" />
                    Expense Date
                  </span>
                }
                name="date"
                rules={[{ required: true, message: 'Please select the date' }]}
                tooltip="Select the date when the expense occurred"
              >
                <DatePicker
                  size="large"
                  className="w-full rounded-lg"
                  format="YYYY-MM-DD"
                  disabledDate={(current) => current && current > dayjs().endOf('day')}
                  suffixIcon={<CalendarOutlined className="text-gray-400" />}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <div className="h-full flex items-center pt-8">
                <Alert
                  message="Expense Tip"
                  description="Ensure the date matches when the expense occurred"
                  type="info"
                  showIcon
                  className="w-full"
                />
              </div>
            </Col>
          </Row>

          <Divider orientation="left">
            <Space>
              <FileTextOutlined className="text-emerald-600" />
              <span className="text-gray-700 dark:text-gray-300 font-semibold">Additional Information</span>
            </Space>
          </Divider>

          <Form.Item
            label={
              <span className="flex items-center gap-2 font-medium">
                <FileTextOutlined className="text-emerald-600" />
                Description / Reason
              </span>
            }
            name="reason"
            rules={[
              { max: 500, message: 'Description cannot exceed 500 characters' },
            ]}
            tooltip="Provide additional context or justification for this expense"
          >
            <TextArea
              placeholder="Provide additional details about this expense... (Optional)"
              rows={5}
              showCount
              maxLength={500}
              className="rounded-lg"
            />
          </Form.Item>

          <Divider />

          <Form.Item className="mb-0">
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <Button
                icon={<CloseOutlined />}
                onClick={() => router.push(`/${role}/expenses`)}
                size="large"
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
                size="large"
                className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 border-none hover:from-emerald-600 hover:to-teal-700"
              >
                Create Expense
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
