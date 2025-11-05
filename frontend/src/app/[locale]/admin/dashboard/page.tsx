'use client'

import React, { useState } from 'react'
import { Typography, Select, Space } from 'antd'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { DashboardStats } from '@/components/dashboard/admin/DashboardStats'
import { QuickStats } from '@/components/dashboard/admin/QuickStats'
import { DashboardCharts } from '@/components/dashboard/admin/DashboardCharts'
import { DashboardTables } from '@/components/dashboard/admin/DashboardTables'
import { DashboardActivity } from '@/components/dashboard/admin/DashboardActivity'
import { QuickActions } from '@/components/dashboard/admin/QuickActions'
import { DashboardIllustration } from '@/components/dashboard/admin/DashboardIllustration'
import { CustomSpinner } from '@/components/ui'
import { DashboardCalendar } from '@/components/dashboard/admin/DashboardCalendar'

const { Title, Text } = Typography

export default function AdminDashboard() {
  const t = useTranslations()
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient.getDashboardStats(),
  })

  // Fetch employee growth data
  const { data: userGrowthData } = useQuery({
    queryKey: ['user-growth-chart'],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/charts/user-growth`, {
        headers: {
          'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch user growth')
      const data = await response.json()
      return data.data || []
    },
  })

  // Fetch departments data
  const { data: departmentsData } = useQuery({
    queryKey: ['departments-chart'],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/charts/departments`, {
        headers: {
          'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch departments')
      const data = await response.json()
      return data.data || []
    },
  })

  // Fetch recent users
  const { data: recentUsers } = useQuery({
    queryKey: ['recent-users'],
    queryFn: async () => {
      const result = await apiClient.getUsers(1, 5)
      return result.data || []
    },
  })

  // Fetch recent applications
  const { data: recentApplications } = useQuery({
    queryKey: ['recent-applications'],
    queryFn: async () => {
      const result = await apiClient.getApplications(1, 5)
      return result.data || []
    },
  })

  // Fetch recent expenses
  const { data: recentExpenses } = useQuery({
    queryKey: ['recent-expenses'],
    queryFn: async () => {
      const result = await apiClient.getExpenses(1, 5)
      return result.data || []
    },
  })

  // Fetch announcements
  const { data: announcements } = useQuery({
    queryKey: ['recent-announcements'],
    queryFn: async () => {
      const result = await apiClient.getAnnouncements()
      return result.data?.slice(0, 5) || []
    },
  })

  // Fetch departments list
  const { data: departments } = useQuery({
    queryKey: ['departments-list'],
    queryFn: () => apiClient.getDepartments(),
  })

  // Format user growth data for chart
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const employeeGrowthData = userGrowthData?.map((item: any) => ({
    month: monthNames[parseInt(item.month) - 1],
    count: parseInt(item.count),
    year: parseInt(item.year),
  })) || []

  // Format departments data for pie chart
  const departmentChartData = departmentsData?.map((dept: any) => ({
    name: dept.name,
    value: parseInt(dept.userCount) || 0,
  })) || []

  if (statsLoading) {
    return (
      <DashboardLayout role="ROLE_ADMIN">
        <div className="flex items-center justify-center min-h-screen">
          <CustomSpinner size="large" text="Loading dashboard..." />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="ROLE_ADMIN">
      <div className="space-y-6 p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Header with Illustration */}
        <div className="relative">
          <div className="absolute right-0 top-0 hidden lg:block opacity-20 dark:opacity-10">
            <DashboardIllustration className="w-64 h-48" />
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
            <div>
              <Title level={2} className="!mb-2 dark:text-white">
                {t('dashboard.admin.title')}
              </Title>
              <Text className="text-gray-600 dark:text-gray-400">
                {t('dashboard.welcome')} • {dayjs().format('MMMM DD, YYYY')}
              </Text>
            </div>
            <Space>
              <Select
                value={timeRange}
                onChange={setTimeRange}
                style={{ width: 120 }}
                options={[
                  { value: 'week', label: t('common.week') || 'Week' },
                  { value: 'month', label: t('common.month') || 'Month' },
                  { value: 'year', label: t('common.year') || 'Year' },
                ]}
                className="dark:bg-gray-800"
              />
            </Space>
          </div>
        </div>

        {/* Dashboard Stats */}
        <DashboardStats 
          stats={stats}
          recentApplications={recentApplications || []}
          recentExpenses={recentExpenses || []}
        />

        {/* Quick Stats */}
        <QuickStats
          stats={stats}
          recentApplications={recentApplications || []}
          departments={departments || []}
          announcements={announcements || []}
        />

        {/* Charts */}
        <DashboardCharts
          employeeGrowthData={employeeGrowthData}
          departmentChartData={departmentChartData}
        />

        {/* Tables */}
        <DashboardTables
          recentApplications={recentApplications || []}
          recentExpenses={recentExpenses || []}
        />

        {/* Activity & Announcements */}
        <DashboardActivity
          announcements={announcements || []}
          recentUsers={recentUsers || []}
        />

        {/* Calendar */}
        <DashboardCalendar />

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </DashboardLayout>
  )
}
