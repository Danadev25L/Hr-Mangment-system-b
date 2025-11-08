'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, Row, Col, Button, List, Avatar } from 'antd'
import {
  ClockCircleOutlined,
  FileTextOutlined,
  BellOutlined,
  CheckCircleOutlined,
  DollarCircleOutlined,
  RocketOutlined,
  PlusOutlined,
  EyeOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useTranslations, useLocale } from 'next-intl'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import apiClient from '@/lib/api'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import { StatCard, LineChartCard, PieChartCard, DoughnutChartCard, CalendarEventCard } from '@/components/charts'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function EmployeeDashboard() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()

  const { data: stats } = useQuery({
    queryKey: ['employee-dashboard-stats'],
    queryFn: async () => {
      const [attendance, applications, announcements, calendarEvents] = await Promise.all([
        apiClient.getMyAttendance({ month: dayjs().month() + 1, year: dayjs().year() }),
        apiClient.getApplications(1, 100),
        apiClient.getAnnouncements(),
        apiClient.getCalendarEvents({
          startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
          endDate: dayjs().endOf('month').format('YYYY-MM-DD')
        })
      ])
      return { attendance, applications, announcements, calendarEvents }
    }
  })

  const attendanceData = stats?.attendance?.records || []
  const applications = stats?.applications?.applications || []
  const announcements = stats?.announcements?.announcements || []
  const calendarEvents = Array.isArray(stats?.calendarEvents?.data) ? stats.calendarEvents.data : []

  const presentDays = attendanceData.filter((a: any) => a.status === 'present').length
  const lateDays = attendanceData.filter((a: any) => a.isLate).length
  const absentDays = attendanceData.filter((a: any) => a.status === 'absent').length
  const pendingApps = applications.filter((a: any) => a.status === 'pending').length
  const approvedApps = applications.filter((a: any) => a.status === 'approved').length
  const rejectedApps = applications.filter((a: any) => a.status === 'rejected').length

  const workingDays = dayjs().date()
  const attendanceRate = workingDays > 0 ? ((presentDays / workingDays) * 100).toFixed(1) : 0

  // Generate last 7 days attendance data for line chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = dayjs().subtract(6 - i, 'day')
    const dayData = attendanceData.filter((a: any) => 
      dayjs(a.date).isSame(date, 'day') && a.status === 'present'
    )
    return {
      date: date.format('MMM DD'),
      present: dayData.length > 0 ? 1 : 0
    }
  })

  const attendanceTrendData = {
    labels: last7Days.map(d => d.date),
    datasets: [
      {
        label: 'Attendance',
        data: last7Days.map(d => d.present),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  }

  const attendanceDistributionData = {
    labels: ['Present', 'Late', 'Absent'],
    datasets: [
      {
        data: [presentDays, lateDays, absentDays],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0,
      }
    ]
  }

  const applicationsStatusData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [
      {
        data: [pendingApps, approvedApps, rejectedApps],
        backgroundColor: ['#3b82f6', '#10b981', '#ef4444'],
        borderWidth: 0,
      }
    ]
  }

  const performanceData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Performance',
        data: [85, 88, 92, 90],
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1.2,
        ticks: {
          stepSize: 0.5
        }
      }
    }
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      }
    },
    cutout: '70%',
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      }
    }
  }

  // Quick stats for employee
  const quickStats = [
    {
      title: t('attendance.myAttendance'),
      value: `${attendanceRate}%`,
      icon: <ClockCircleOutlined />,
      color: 'green' as const,
      trend: `${presentDays}/${workingDays} days`,
      isUp: true,
      onClick: () => router.push(`/${locale}/employee/attendance`)
    },
    {
      title: t('applications.myApplications'),
      value: pendingApps,
      icon: <FileTextOutlined />,
      color: 'blue' as const,
      trend: 'Pending',
      isUp: false,
      onClick: () => router.push(`/${locale}/employee/applications`)
    },
    {
      title: t('announcements.title'),
      value: announcements.length,
      icon: <BellOutlined />,
      color: 'purple' as const,
      trend: 'New updates',
      isUp: true,
      onClick: () => router.push(`/${locale}/employee/announcements`)
    },
  ]

  return (
    <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <span className="text-5xl">👋</span>
            {t('dashboard.welcome')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
            Here&apos;s what&apos;s happening with your work today
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {dayjs().format('dddd')}
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {dayjs().format('MMM DD, YYYY')}
          </div>
          <div className="text-lg text-gray-600 dark:text-gray-300">
            {dayjs().format('HH:mm A')}
          </div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <Row gutter={[16, 16]}>
        {quickStats.map((stat, index) => (
          <Col xs={24} sm={12} lg={8} key={index}>
            <StatCard {...stat} />
          </Col>
        ))}
      </Row>

      {/* Calendar Section */}
      <CalendarEventCard 
        events={calendarEvents}
        showAddButton={false}
      />

      {/* Quick Actions */}
      <Card
        title={
          <span className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
            <RocketOutlined className="mr-2 text-blue-500 dark:text-blue-400" />
            {t('dashboard.quickActions')}
          </span>
        }
        className="shadow-lg border-0 bg-white dark:bg-gray-800 transition-colors"
      >
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Button
              block
              size="large"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => router.push(`/${locale}/employee/applications/new`)}
              className="h-24 bg-blue-500 hover:bg-blue-600 flex flex-col items-center justify-center"
            >
              <div className="text-sm mt-1">{t('applications.apply')}</div>
            </Button>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Button
              block
              size="large"
              icon={<ClockCircleOutlined />}
              onClick={() => router.push(`/${locale}/employee/attendance`)}
              className="h-24 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 flex flex-col items-center justify-center"
            >
              <div className="text-sm mt-1">{t('attendance.myAttendance')}</div>
            </Button>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Button
              block
              size="large"
              icon={<DollarCircleOutlined />}
              onClick={() => router.push(`/${locale}/employee/expenses/new`)}
              className="h-24 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 flex flex-col items-center justify-center"
            >
              <div className="text-sm mt-1">{t('expenses.submit')}</div>
            </Button>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Button
              block
              size="large"
              icon={<UserOutlined />}
              onClick={() => router.push(`/${locale}/employee/profile`)}
              className="h-24 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 flex flex-col items-center justify-center"
            >
              <div className="text-sm mt-1">{t('profile.title')}</div>
            </Button>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Button
              block
              size="large"
              icon={<BellOutlined />}
              onClick={() => router.push(`/${locale}/employee/announcements`)}
              className="h-24 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 flex flex-col items-center justify-center"
            >
              <div className="text-sm mt-1">{t('announcements.title')}</div>
            </Button>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Button
              block
              size="large"
              icon={<EyeOutlined />}
              onClick={() => router.push(`/${locale}/employee/applications`)}
              className="h-24 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 flex flex-col items-center justify-center"
            >
              <div className="text-sm mt-1">{t('applications.viewAll')}</div>
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Statistics & Analytics */}
      <Card
        title={
          <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            📊 {t('dashboard.statistics')}
          </span>
        }
        className="shadow-lg border-0 bg-white dark:bg-gray-800 transition-colors"
      >
        <Row gutter={[16, 16]}>
          {/* Attendance Trend Chart */}
          <Col xs={24} lg={12}>
            <LineChartCard
              title={t('attendance.myAttendance') + ' - Last 7 Days'}
              data={attendanceTrendData}
              height={300}
            />
          </Col>

          {/* Attendance Distribution */}
          <Col xs={24} lg={12}>
            <DoughnutChartCard
              title={t('attendance.title') + ' Distribution'}
              data={attendanceDistributionData}
              height={300}
            />
          </Col>

          {/* Applications Status */}
          <Col xs={24} lg={12}>
            <PieChartCard
              title={t('applications.title') + ' Status'}
              data={applicationsStatusData}
              height={300}
            />
          </Col>

          {/* Summary Stats */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  <CheckCircleOutlined className="mr-2" />
                  {t('dashboard.todaySummary')}
                </span>
              }
              className="shadow-lg border-0 bg-white dark:bg-gray-800 transition-colors h-full"
            >
              <Row gutter={[16, 16]}>
                <Col xs={24}>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {presentDays}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {t('attendance.present')} Days
                    </div>
                  </div>
                </Col>
                <Col xs={24}>
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {lateDays}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {t('attendance.late')} Days
                    </div>
                  </div>
                </Col>
                <Col xs={24}>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {absentDays}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {t('attendance.absent')} Days
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Recent Announcements */}
      <Card
        title={
          <span className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            <BellOutlined className="mr-2 text-purple-500 dark:text-purple-400" />
            {t('announcements.recentAnnouncements')}
          </span>
        }
        extra={
          <Button 
            type="link" 
            onClick={() => router.push(`/${locale}/employee/announcements`)}
            className="text-blue-500 dark:text-blue-400"
          >
            {t('common.viewAll')}
          </Button>
        }
        className="shadow-lg border-0 bg-white dark:bg-gray-800 transition-colors"
      >
        {announcements.length > 0 ? (
          <List
            dataSource={announcements.slice(0, 5)}
            renderItem={(item: any) => (
              <List.Item
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                onClick={() => router.push(`/${locale}/employee/announcements`)}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<BellOutlined />} className="bg-purple-500" />}
                  title={
                    <span className="text-gray-800 dark:text-gray-100">
                      {item.title || 'Announcement'}
                    </span>
                  }
                  description={
                    <span className="text-gray-600 dark:text-gray-400">
                      {dayjs(item.date).format('MMM DD, YYYY')}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {t('dashboard.noAnnouncements')}
          </div>
        )}
      </Card>
    </div>
  )
}

