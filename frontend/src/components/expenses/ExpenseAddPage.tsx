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
import { useTranslations } from 'next-intl'

const { TextArea } = Input
const { Title } = Typography

interface ExpenseAddPageProps {
  role: 'admin' | 'manager'
}

export default function ExpenseAddPage({ role }: ExpenseAddPageProps) {
  const t = useTranslations()
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
      message.success(t('expenses.add.success'))
      router.push(`/${role}/expenses`)
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || t('expenses.add.error'))
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
              {t('expenses.addExpense')}
            </Title>
            <p className="text-gray-500 dark:text-gray-400 m-0 flex items-center gap-2">
              <InfoCircleOutlined />
              {role === 'admin'
                ? t('expenses.add.subtitleAdmin')
                : t('expenses.add.subtitleManager')}
            </p>
          </div>
          <div className="hidden md:flex gap-2">
            <Tag icon={<CheckCircleOutlined />} color="success">{t('expenses.add.quickEntry')}</Tag>
            <Tag icon={<DollarOutlined />} color="processing">{t('expenses.add.financial')}</Tag>
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
                    {t('expenses.department')}
                  </span>
                }
                name="departmentId"
                rules={[{ required: true, message: t('expenses.form.departmentRequired') }]}
                tooltip={t('expenses.add.departmentTooltip')}
                className="mb-0"
              >
                <Select
                  placeholder={t('expenses.form.selectDepartment')}
                  size="large"
                  showSearch
                  optionFilterProp="children"
                  className="rounded-lg"
                  suffixIcon={<BankOutlined className="text-gray-400" />}
                >
                  <Select.Option value={0}>
                    <Space>
                      <BankOutlined className="text-purple-500" />
                      <span className="font-medium">{t('expenses.view.companyWide')}</span>
                      <Tag color="purple" className="ml-2">{t('expenses.add.allDepartments')}</Tag>
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
              <span className="text-gray-700 dark:text-gray-300 font-semibold">{t('expenses.add.expenseDetails')}</span>
            </Space>
          </Divider>

          <Row gutter={[24, 16]}>
            <Col xs={24} md={16}>
              <Form.Item
                label={
                  <span className="flex items-center gap-2 font-medium">
                    <ShoppingOutlined className="text-emerald-600" />
                    {t('expenses.add.expenseItemName')}
                  </span>
                }
                name="itemName"
                rules={[
                  { required: true, message: t('expenses.form.itemNameRequired') },
                  { max: 200, message: t('expenses.add.itemNameMaxLength') },
                ]}
              >
                <Input
                  prefix={<ShoppingOutlined className="text-gray-400" />}
                  placeholder={t('expenses.form.itemNamePlaceholder')}
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
                    {t('expenses.amount')}
                  </span>
                }
                name="amount"
                rules={[
                  { required: true, message: t('expenses.form.amountRequired') },
                  { type: 'number', min: 0.01, message: t('expenses.form.amountMin') },
                ]}
                tooltip={t('expenses.add.amountTooltip')}
              >
                <InputNumber
                  prefix={<CreditCardOutlined className="text-gray-400" />}
                  placeholder="0.00"
                  size="large"
                  className="w-full rounded-lg"
                  precision={2}
                  min={0}
                  formatter={(value) => t('expenses.amountValue', { amount: value || 0 })}
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
                    {t('expenses.view.expenseDate')}
                  </span>
                }
                name="date"
                rules={[{ required: true, message: t('expenses.form.dateRequired') }]}
                tooltip={t('expenses.add.dateTooltip')}
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
                  message={t('expenses.add.expenseTip')}
                  description={t('expenses.add.expenseTipDescription')}
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
              <span className="text-gray-700 dark:text-gray-300 font-semibold">{t('expenses.view.additionalInformation')}</span>
            </Space>
          </Divider>

          <Form.Item
            label={
              <span className="flex items-center gap-2 font-medium">
                <FileTextOutlined className="text-emerald-600" />
                {t('expenses.reason')}
              </span>
            }
            name="reason"
            rules={[
              { max: 500, message: t('expenses.add.descriptionMaxLength') },
            ]}
            tooltip={t('expenses.add.descriptionTooltip')}
          >
            <TextArea
              placeholder={t('expenses.add.descriptionPlaceholder')}
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
                {t('common.cancel')}
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
                size="large"
                className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 border-none hover:from-emerald-600 hover:to-teal-700"
              >
                {t('expenses.add.createExpense')}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
