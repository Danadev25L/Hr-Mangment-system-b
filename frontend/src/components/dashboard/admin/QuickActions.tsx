'use client'

import React from 'react'
import { Card, Row, Col, Button, Space, Typography } from 'antd'
import {
  PlusOutlined,
  TeamOutlined,
  FileTextOutlined,
  DollarOutlined,
  BellOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  BankOutlined,
  ClockCircleOutlined,
  UserAddOutlined,
} from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { createLocalizedPath, getCurrentLocale } from '@/lib/localized-routes'

const { Text } = Typography

export function QuickActions() {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const locale = getCurrentLocale(pathname)

  const quickActions = [
    {
      icon: <UserAddOutlined />,
      label: t('dashboard.actions.addEmployee'),
      path: createLocalizedPath(locale, '/admin/users/new'),
      color: 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30',
      iconColor: 'text-blue-500',
    },
    {
      icon: <BankOutlined />,
      label: t('dashboard.actions.manageDepartments'),
      path: createLocalizedPath(locale, '/admin/departments'),
      color: 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30',
      iconColor: 'text-purple-500',
    },
    {
      icon: <FileTextOutlined />,
      label: t('dashboard.actions.reviewApplications'),
      path: createLocalizedPath(locale, '/admin/applications'),
      color: 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30',
      iconColor: 'text-green-500',
    },
    {
      icon: <DollarOutlined />,
      label: t('dashboard.actions.reviewExpenses'),
      path: createLocalizedPath(locale, '/admin/expenses'),
      color: 'bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30',
      iconColor: 'text-yellow-500',
    },
    {
      icon: <BellOutlined />,
      label: t('dashboard.actions.announcements'),
      path: createLocalizedPath(locale, '/admin/announcements'),
      color: 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30',
      iconColor: 'text-orange-500',
    },
    {
      icon: <CalendarOutlined />,
      label: t('dashboard.actions.manageHolidays'),
      path: createLocalizedPath(locale, '/admin/holidays'),
      color: 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30',
      iconColor: 'text-red-500',
    },
    {
      icon: <ClockCircleOutlined />,
      label: t('dashboard.actions.attendance'),
      path: createLocalizedPath(locale, '/admin/attendance'),
      color: 'bg-cyan-50 dark:bg-cyan-900/20 hover:bg-cyan-100 dark:hover:bg-cyan-900/30',
      iconColor: 'text-cyan-500',
    },
    {
      icon: <TeamOutlined />,
      label: t('dashboard.actions.viewEmployees'),
      path: createLocalizedPath(locale, '/admin/employees'),
      color: 'bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30',
      iconColor: 'text-indigo-500',
    },
  ]

  return (
    <Card
      title={
        <Space>
          <ThunderboltOutlined className="text-yellow-500" />
          <Text strong className="dark:text-white">{t('dashboard.quickActions')}</Text>
        </Space>
      }
      className="dark:bg-gray-800 dark:border-gray-700"
    >
      <Row gutter={[16, 16]}>
        {quickActions.map((action, index) => (
          <Col xs={12} sm={8} md={6} lg={4} xl={3} key={index}>
            <button
              onClick={() => router.push(action.path)}
              className={`w-full h-24 rounded-lg ${action.color} border border-gray-200 dark:border-gray-700 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer`}
            >
              <div className={`text-2xl ${action.iconColor}`}>
                {action.icon}
              </div>
              <Text className="text-xs text-center dark:text-gray-300 px-2">
                {action.label}
              </Text>
            </button>
          </Col>
        ))}
      </Row>
    </Card>
  )
}
