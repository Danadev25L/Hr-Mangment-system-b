'use client'

import React from 'react'
import { Row, Col, Card, Statistic, Tooltip, Typography } from 'antd'
import {
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  DollarOutlined,
  RiseOutlined,
  SafetyOutlined,
  WarningOutlined,
  ShoppingOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { createLocalizedPath, getCurrentLocale } from '@/lib/localized-routes'

const { Text } = Typography

interface DashboardStatsProps {
  stats: any
  recentApplications: any[]
  recentExpenses: any[]
}

export function DashboardStats({ stats, recentApplications, recentExpenses }: DashboardStatsProps) {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const locale = getCurrentLocale(pathname)

  const gradientCards = [
    {
      title: t('dashboard.admin.totalEmployees'),
      value: stats?.totalUsers || 0,
      icon: <UserOutlined className="text-white" />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      path: createLocalizedPath(locale, '/admin/users'),
      footer: {
        icon: <RiseOutlined className="mr-1" />,
        text: t('dashboard.stats.growth', { percent: '+12%' }),
      },
    },
    {
      title: t('dashboard.admin.totalDepartments'),
      value: stats?.totalDepartments || 0,
      icon: <TeamOutlined className="text-white" />,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      path: createLocalizedPath(locale, '/admin/departments'),
      footer: {
        icon: <SafetyOutlined className="mr-1" />,
        text: t('dashboard.stats.activeDepartments'),
      },
    },
    {
      title: t('dashboard.admin.pendingApplications'),
      value: recentApplications?.filter((app: any) => app.status === 'pending')?.length || 0,
      icon: <FileTextOutlined className="text-white" />,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      path: createLocalizedPath(locale, '/admin/applications'),
      footer: {
        icon: <WarningOutlined className="mr-1" />,
        text: t('dashboard.stats.requiresAttention'),
      },
    },
    {
      title: t('dashboard.admin.totalExpenses'),
      value: recentExpenses?.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0) || 0,
      icon: <DollarOutlined className="text-white" />,
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      path: createLocalizedPath(locale, '/admin/expenses'),
      footer: {
        icon: <ShoppingOutlined className="mr-1" />,
        text: t('dashboard.stats.thisMonth'),
      },
      precision: 0,
    },
  ]

  return (
    <Row gutter={[16, 16]}>
      {gradientCards.map((card, index) => (
        <Col xs={24} sm={12} lg={6} key={index}>
          <Card
            className="card-hover cursor-pointer transition-all hover:shadow-lg"
            style={{
              background: card.gradient,
              border: 'none',
              color: 'white',
            }}
            onClick={() => router.push(card.path)}
          >
            <Statistic
              title={<span className="text-white/90 font-semibold">{card.title}</span>}
              value={card.value}
              prefix={card.icon}
              valueStyle={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}
              precision={card.precision}
              suffix={
                <Tooltip title={t('common.viewAll')}>
                  <ArrowUpOutlined className="text-white/70 text-sm ml-2" />
                </Tooltip>
              }
            />
            <div className="mt-4 flex items-center text-white/80 text-sm">
              {card.footer.icon}
              <Text className="text-white/80">{card.footer.text}</Text>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  )
}
