'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { useLocale, useTranslations } from 'next-intl'
import { 
  Card, 
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
  BankOutlined,
  FileTextOutlined,
  TeamOutlined,
  EyeOutlined,
  WalletOutlined,
  AuditOutlined
} from '@ant-design/icons'
import { Expense } from '@/types'
import dayjs from 'dayjs'
import {
  EnhancedCard,
  EnhancedButton,
  CustomSpinner,
  StatusBadge,
} from '@/components/ui'

interface ExpenseViewPageProps {
  role: 'admin' | 'manager'
}

export function ExpenseViewPage({ role }: ExpenseViewPageProps) {
  const params = useParams()
  const locale = useLocale()
  const t = useTranslations()
  const id = params.id as string

  const { data: expenseData, isLoading } = useQuery({
    queryKey: ['expense', id],
    queryFn: () => apiClient.getExpense(id),
    enabled: !!id,
  })

  const basePath = role === 'admin' ? '/admin' : '/manager'
  const listPath = `/${locale}${basePath}/expenses`
  const editPath = `/${locale}${basePath}/expenses/${id}/edit`
  const dashboardPath = `/${locale}${basePath}/dashboard`

  // Navigate with locale support
  const handleNavigation = (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <CustomSpinner size="large" text={t('expenses.view.loading')} />
      </div>
    )
  }

  if (!expenseData) {
    return <div className="text-center text-gray-500">{t('expenses.view.notFound')}</div>
  }

  const expense: Expense = expenseData

  // Status tag configuration
  const getStatusTag = (status: string) => {
    const statusConfig = {
      pending: { color: 'gold', icon: <ClockCircleOutlined />, text: t('expenses.pending') },
      approved: { color: 'green', icon: <CheckCircleOutlined />, text: t('expenses.approved') },
      rejected: { color: 'red', icon: <CloseCircleOutlined />, text: t('expenses.rejected') },
      paid: { color: 'blue', icon: <CheckCircleOutlined />, text: t('expenses.paid') },
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
        <p className="font-semibold">{t('expenses.view.expenseCreated')}</p>
        <p className="text-sm text-gray-500">
          {t('expenses.view.by')}: {expense.userName}
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
          <p className="font-semibold">{t('expenses.view.expenseApproved')}</p>
          <p className="text-sm text-gray-500">
            {t('expenses.view.by')}: {expense.approvedByName}
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
          <p className="font-semibold">{t('expenses.view.expenseRejected')}</p>
          <p className="text-sm text-gray-500">
            {t('expenses.view.by')}: {expense.rejectedByName}
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
          <p className="font-semibold">{t('expenses.view.paymentProcessed')}</p>
          <p className="text-sm text-gray-500">
            {t('expenses.view.by')}: {expense.paidByName}
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
            title: (
              <Space>
                <EyeOutlined />
                <span>{t('expenses.view.expenseDetails')}</span>
              </Space>
            ),
          },
        ]}
      />

      {/* Header Card */}
      <EnhancedCard className="mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <DollarOutlined className="text-white text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {expense.itemName || t('expenses.view.expenseDetails')}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${Number(expense.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <CalendarOutlined />
                  <span>{dayjs(expense.date).format('MMMM DD, YYYY')}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={expense.status} size="default" />
                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                  <UserOutlined />
                  <span>{expense.userName}</span>
                </div>
                {expense.departmentName && (
                  <>
                    <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <TeamOutlined />
                      <span>{expense.departmentName}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <EnhancedButton
              variant="ghost"
              icon={<ArrowLeftOutlined />}
              onClick={() => handleNavigation(listPath)}
            >
              {t('common.back')}
            </EnhancedButton>
            {(role === 'admin' || expense.status === 'pending') && (
              <EnhancedButton
                variant="primary"
                icon={<EditOutlined />}
                onClick={() => handleNavigation(editPath)}
              >
                {t('common.edit')}
              </EnhancedButton>
            )}
          </div>
        </div>
      </EnhancedCard>

      {/* Content */}
      <Row gutter={[24, 24]}>
        {/* Main Information */}
        <Col xs={24} lg={12}>
          <EnhancedCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FileTextOutlined className="text-white text-lg" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('expenses.view.expenseInformation')}
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <FileTextOutlined className="text-blue-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('expenses.view.itemName')}</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{expense.itemName || t('expenses.na')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <DollarOutlined className="text-green-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('expenses.amount')}</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-lg">
                    ${Number(expense.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <CalendarOutlined className="text-purple-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('expenses.view.expenseDate')}</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {dayjs(expense.date).format('MMMM DD, YYYY')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <UserOutlined className="text-orange-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('expenses.submittedBy')}</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{expense.userName}</p>
                </div>
              </div>
            </div>
          </EnhancedCard>
        </Col>

        {/* Additional Details */}
        <Col xs={24} lg={12}>
          <EnhancedCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                <TeamOutlined className="text-white text-lg" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('expenses.view.additionalInformation')}
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <TeamOutlined className="text-blue-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('expenses.department')}</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {expense.departmentName || t('expenses.view.companyWide')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <ClockCircleOutlined className="text-purple-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('expenses.createdAt')}</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {dayjs(expense.createdAt).format('MMM DD, YYYY hh:mm A')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <AuditOutlined className="text-green-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('expenses.status')}</p>
                  <div className="mt-1">
                    <StatusBadge status={expense.status} size="default" />
                  </div>
                </div>
              </div>
            </div>
          </EnhancedCard>
        </Col>
      </Row>

      {/* Description Section */}
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <EnhancedCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <FileTextOutlined className="text-white text-lg" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('expenses.reason')}
              </h3>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">{expense.reason}</p>
            </div>
          </EnhancedCard>
        </Col>
      </Row>

      {/* Approval/Rejection Details & Timeline */}
      <Row gutter={[24, 24]}>
        {(expense.approvedByName || expense.rejectedByName || expense.paidByName) && (
          <Col xs={24} lg={12}>
            <EnhancedCard>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <AuditOutlined className="text-white text-lg" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t('expenses.view.actionDetails')}
                </h3>
              </div>
              <div className="space-y-4">
                {expense.approvedByName && (
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircleOutlined className="text-green-500 mt-1 text-lg" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('expenses.approvedBy')}</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{expense.approvedByName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {dayjs(expense.approvedAt).format('MMM DD, YYYY hh:mm A')}
                      </p>
                    </div>
                  </div>
                )}
                {expense.rejectedByName && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <CloseCircleOutlined className="text-red-500 mt-1 text-lg" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('expenses.rejectedBy')}</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{expense.rejectedByName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {dayjs(expense.rejectedAt).format('MMM DD, YYYY hh:mm A')}
                      </p>
                    </div>
                  </div>
                )}
                {expense.paidByName && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <BankOutlined className="text-blue-500 mt-1 text-lg" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('expenses.view.paymentProcessedBy')}</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{expense.paidByName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {dayjs(expense.paidAt).format('MMM DD, YYYY hh:mm A')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </EnhancedCard>
          </Col>
        )}

        {/* Timeline */}
        <Col xs={24} lg={(expense.approvedByName || expense.rejectedByName || expense.paidByName) ? 12 : 24}>
          <EnhancedCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <ClockCircleOutlined className="text-white text-lg" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('expenses.view.statusTimeline')}
              </h3>
            </div>
            <Timeline items={timelineItems} />
          </EnhancedCard>
        </Col>
      </Row>
    </div>
  )
}
