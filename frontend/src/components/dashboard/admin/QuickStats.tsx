'use client'

import React from 'react'
import { Row, Col, Card, Statistic, Typography } from 'antd'
import {
  CheckCircleOutlined,
  TrophyOutlined,
  FireOutlined,
  StarOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  BellOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'

const { Text } = Typography

interface QuickStatsProps {
  stats: any
  recentApplications: any[]
  departments: any[]
  announcements: any[]
}

export function QuickStats({ stats, recentApplications, departments, announcements }: QuickStatsProps) {
  const t = useTranslations()

  // Fetch quick stats from backend
  const { data: quickStatsData } = useQuery({
    queryKey: ['quick-stats'],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/quick-stats`, {
        headers: {
          'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
        },
      })
      if (!response.ok) return {}
      const data = await response.json()
      return data.data || {}
    },
  })

  const quickStats = [
    {
      icon: <CheckCircleOutlined />,
      value: stats?.totalUsers || 0,
      label: t('dashboard.stats.activeUsers'),
      color: 'text-blue-500',
    },
    {
      icon: <TrophyOutlined />,
      value: quickStatsData?.attendanceRate || 95,
      suffix: '%',
      label: t('dashboard.stats.attendance'),
      color: 'text-green-500',
    },
    {
      icon: <FireOutlined />,
      value: quickStatsData?.pendingApplications || 0,
      label: t('dashboard.stats.pendingApplications'),
      color: 'text-orange-500',
    },
    {
      icon: <StarOutlined />,
      value: stats?.totalDepartments || 0,
      label: t('dashboard.stats.departments'),
      color: 'text-purple-500',
    },
    {
      icon: <ClockCircleOutlined />,
      value: quickStatsData?.lateToday || 0,
      label: t('dashboard.stats.lateToday'),
      color: 'text-red-500',
    },
    {
      icon: <CalendarOutlined />,
      value: quickStatsData?.holidaysThisMonth || 0,
      label: t('dashboard.stats.holidaysThisMonth'),
      color: 'text-cyan-500',
    },
    {
      icon: <BellOutlined />,
      value: announcements?.length || 0,
      label: t('dashboard.stats.announcements'),
      color: 'text-yellow-500',
    },
    {
      icon: <DollarOutlined />,
      value: quickStatsData?.pendingSalaries || 0,
      label: t('dashboard.stats.pendingSalaries'),
      color: 'text-pink-500',
    },
  ]

  return (
    <Row gutter={[16, 16]}>
      {quickStats.map((stat, index) => (
        <Col xs={12} sm={6} lg={3} key={index}>
          <Card className="text-center hover:shadow-md transition-all dark:bg-gray-800 dark:border-gray-700">
            <div className={`text-3xl mb-2 ${stat.color}`}>
              {stat.icon}
            </div>
            <Statistic
              value={stat.value}
              suffix={stat.suffix}
              valueStyle={{ fontSize: '20px' }}
              className="dark:text-white"
            />
            <Text className="text-gray-500 dark:text-gray-400 text-xs">{stat.label}</Text>
          </Card>
        </Col>
      ))}
    </Row>
  )
}
