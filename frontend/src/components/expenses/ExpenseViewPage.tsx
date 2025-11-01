'use client'

import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { 
  Card, 
  Spin, 
  Descriptions, 
  Tag, 
  Button, 
  Space, 
  Breadcrumb,
  Row,
  Col,
  Timeline,
  Divider
} from 'antd'
import { 
  DollarOutlined, 
  EditOutlined, 
  ArrowLeftOutlined, 
  HomeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  BankOutlined
} from '@ant-design/icons'
import { Expense } from '@/types'
import dayjs from 'dayjs'

interface ExpenseViewPageProps {
  role: 'admin' | 'manager'
}

export function ExpenseViewPage({ role }: ExpenseViewPageProps) {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const { data: expenseData, isLoading } = useQuery({
    queryKey: ['expense', id],
    queryFn: () => apiClient.getExpense(id),
    enabled: !!id,
  })

  const basePath = role === 'admin' ? '/admin' : '/manager'
  const listPath = `${basePath}/expenses`
  const editPath = `${basePath}/expenses/${id}/edit`
  const dashboardPath = `${basePath}/dashboard`

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    )
  }

  if (!expenseData) {
    return <div className="text-center text-gray-500">Expense not found</div>
  }

  const expense: Expense = expenseData

  // Status tag configuration
  const getStatusTag = (status: string) => {
    const statusConfig = {
      pending: { color: 'gold', icon: <ClockCircleOutlined />, text: 'Pending' },
      approved: { color: 'green', icon: <CheckCircleOutlined />, text: 'Approved' },
      rejected: { color: 'red', icon: <CloseCircleOutlined />, text: 'Rejected' },
      paid: { color: 'blue', icon: <CheckCircleOutlined />, text: 'Paid' },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    )
  }

  // Build timeline for status changes
  const timelineItems = []
  
  // Created
  timelineItems.push({
    color: 'blue',
    dot: <UserOutlined />,
    children: (
      <div>
        <p className="font-semibold">Expense Created</p>
        <p className="text-sm text-gray-500">
          By: {expense.userName}
        </p>
        <p className="text-sm text-gray-500">
          {dayjs(expense.createdAt).format('MMM DD, YYYY hh:mm A')}
        </p>
      </div>
    ),
  })

  // Approved
  if (expense.approvedAt && expense.approvedByName) {
    timelineItems.push({
      color: 'green',
      dot: <CheckCircleOutlined />,
      children: (
        <div>
          <p className="font-semibold">Expense Approved</p>
          <p className="text-sm text-gray-500">
            By: {expense.approvedByName}
          </p>
          <p className="text-sm text-gray-500">
            {dayjs(expense.approvedAt).format('MMM DD, YYYY hh:mm A')}
          </p>
        </div>
      ),
    })
  }

  // Rejected
  if (expense.rejectedAt && expense.rejectedByName) {
    timelineItems.push({
      color: 'red',
      dot: <CloseCircleOutlined />,
      children: (
        <div>
          <p className="font-semibold">Expense Rejected</p>
          <p className="text-sm text-gray-500">
            By: {expense.rejectedByName}
          </p>
          <p className="text-sm text-gray-500">
            {dayjs(expense.rejectedAt).format('MMM DD, YYYY hh:mm A')}
          </p>
        </div>
      ),
    })
  }

  // Paid
  if (expense.paidAt && expense.paidByName) {
    timelineItems.push({
      color: 'purple',
      dot: <BankOutlined />,
      children: (
        <div>
          <p className="font-semibold">Payment Processed</p>
          <p className="text-sm text-gray-500">
            By: {expense.paidByName}
          </p>
          <p className="text-sm text-gray-500">
            {dayjs(expense.paidAt).format('MMM DD, YYYY hh:mm A')}
          </p>
        </div>
      ),
    })
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
            title: 'View Details',
          },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Expense Details
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View complete expense information and approval history
          </p>
        </div>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push(listPath)}>
            Back to List
          </Button>
          {(role === 'admin' || expense.status === 'pending') && (
            <Button type="primary" icon={<EditOutlined />} onClick={() => router.push(editPath)}>
              Edit Expense
            </Button>
          )}
        </Space>
      </div>

      {/* Content */}
      <Row gutter={16}>
        {/* Main Information */}
        <Col xs={24} lg={16}>
          <Card title="Expense Information">
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Item Name">
                <strong>{expense.itemName || 'N/A'}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Amount">
                <span className="text-lg font-semibold text-green-600">
                  ${Number(expense.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {getStatusTag(expense.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Expense Date">
                <CalendarOutlined className="mr-2" />
                {dayjs(expense.date).format('MMMM DD, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Reason/Description">
                <div className="whitespace-pre-wrap">{expense.reason}</div>
              </Descriptions.Item>
              <Descriptions.Item label="Submitted By">
                <UserOutlined className="mr-2" />
                {expense.userName}
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                {expense.departmentName || 'Company-wide'}
              </Descriptions.Item>
              <Descriptions.Item label="Submitted On">
                {dayjs(expense.createdAt).format('MMM DD, YYYY hh:mm A')}
              </Descriptions.Item>
            </Descriptions>

            {/* Approval/Rejection Details */}
            {(expense.approvedByName || expense.rejectedByName || expense.paidByName) && (
              <>
                <Divider>Action Details</Divider>
                <Descriptions bordered column={1}>
                  {expense.approvedByName && (
                    <>
                      <Descriptions.Item label="Approved By">
                        <CheckCircleOutlined className="mr-2 text-green-500" />
                        {expense.approvedByName}
                      </Descriptions.Item>
                      <Descriptions.Item label="Approved On">
                        {dayjs(expense.approvedAt).format('MMM DD, YYYY hh:mm A')}
                      </Descriptions.Item>
                    </>
                  )}
                  {expense.rejectedByName && (
                    <>
                      <Descriptions.Item label="Rejected By">
                        <CloseCircleOutlined className="mr-2 text-red-500" />
                        {expense.rejectedByName}
                      </Descriptions.Item>
                      <Descriptions.Item label="Rejected On">
                        {dayjs(expense.rejectedAt).format('MMM DD, YYYY hh:mm A')}
                      </Descriptions.Item>
                    </>
                  )}
                  {expense.paidByName && (
                    <>
                      <Descriptions.Item label="Payment Processed By">
                        <BankOutlined className="mr-2 text-blue-500" />
                        {expense.paidByName}
                      </Descriptions.Item>
                      <Descriptions.Item label="Payment Date">
                        {dayjs(expense.paidAt).format('MMM DD, YYYY hh:mm A')}
                      </Descriptions.Item>
                    </>
                  )}
                </Descriptions>
              </>
            )}
          </Card>
        </Col>

        {/* Timeline */}
        <Col xs={24} lg={8}>
          <Card title="Status History">
            <Timeline items={timelineItems} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
