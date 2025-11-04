'use client'

import React from 'react'
import { Row, Col, Card, Table, Tag, Button, Space, Avatar, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  FileTextOutlined,
  DollarOutlined,
  PlusOutlined,
  EyeOutlined,
  UserOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { createLocalizedPath, getCurrentLocale } from '@/lib/localized-routes'

const { Text } = Typography

interface DashboardTablesProps {
  recentApplications: any[]
  recentExpenses: any[]
}

export function DashboardTables({ recentApplications, recentExpenses }: DashboardTablesProps) {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const locale = getCurrentLocale(pathname)

  const applicationColumns: ColumnsType<any> = [
    {
      title: t('applications.employee'),
      dataIndex: 'userName',
      key: 'userName',
      render: (text: string) => (
        <Space>
          <Avatar icon={<UserOutlined />} size="small" />
          <Text className="dark:text-gray-200">{text}</Text>
        </Space>
      ),
    },
    {
      title: t('applications.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          leave: 'blue',
          vacation: 'green',
          sick: 'red',
          personal: 'orange',
        }
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>
      },
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          pending: 'gold',
          approved: 'green',
          rejected: 'red',
        }
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
      },
    },
    {
      title: t('common.date'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <Text className="dark:text-gray-300">{dayjs(date).format('MMM DD, YYYY')}</Text>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => router.push(createLocalizedPath(locale, `/admin/applications/${record.id}`))}
          className="dark:text-blue-400"
        >
          {t('common.view')}
        </Button>
      ),
    },
  ]

  const expenseColumns: ColumnsType<any> = [
    {
      title: t('expenses.employee'),
      dataIndex: 'userName',
      key: 'userName',
      render: (text: string) => (
        <Space>
          <Avatar icon={<DollarOutlined />} size="small" />
          <Text className="dark:text-gray-200">{text}</Text>
        </Space>
      ),
    },
    {
      title: t('expenses.amount'),
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <Text strong className="dark:text-green-400">${amount?.toLocaleString() || 0}</Text>
      ),
    },
    {
      title: t('expenses.category'),
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag>{category}</Tag>,
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          pending: 'gold',
          approved: 'green',
          rejected: 'red',
        }
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
      },
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => router.push(createLocalizedPath(locale, `/admin/expenses/${record.id}`))}
          className="dark:text-blue-400"
        >
          {t('common.view')}
        </Button>
      ),
    },
  ]

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card
          title={
            <div className="flex items-center justify-between">
              <Space>
                <FileTextOutlined className="text-blue-500" />
                <Text strong className="dark:text-white">{t('dashboard.recentApplications')}</Text>
              </Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push(createLocalizedPath(locale, '/admin/applications'))}
              >
                {t('common.viewAll')}
              </Button>
            </div>
          }
          className="dark:bg-gray-800 dark:border-gray-700"
        >
          <Table
            dataSource={recentApplications}
            columns={applicationColumns}
            pagination={false}
            size="small"
            rowKey="id"
            className="dark-table"
          />
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card
          title={
            <div className="flex items-center justify-between">
              <Space>
                <DollarOutlined className="text-green-500" />
                <Text strong className="dark:text-white">{t('dashboard.recentExpenses')}</Text>
              </Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push(createLocalizedPath(locale, '/admin/expenses'))}
              >
                {t('common.viewAll')}
              </Button>
            </div>
          }
          className="dark:bg-gray-800 dark:border-gray-700"
        >
          <Table
            dataSource={recentExpenses}
            columns={expenseColumns}
            pagination={false}
            size="small"
            rowKey="id"
            className="dark-table"
          />
        </Card>
      </Col>
    </Row>
  )
}
