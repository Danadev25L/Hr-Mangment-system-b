'use client'

// Fixed compilation issues
import React from 'react'
import { Row, Col, Card, Statistic, Typography, List, Avatar } from 'antd'
import { useTranslations } from 'next-intl'
import {
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  FileTextOutlined,
  RiseOutlined,
  CalendarOutlined,
  NotificationOutlined,
} from '@ant-design/icons'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const { Title, Text } = Typography

export default function AdminDashboard() {
  const t = useTranslations()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient.getDashboardStats(),
  })

  const { data: recentActivities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: () => apiClient.getDashboardStats().then(data => data.recentActivities || []),
  })

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['user-growth-chart'],
    queryFn: () => apiClient.getChartData('user-growth'),
  })

  const { data: departmentData, isLoading: departmentLoading } = useQuery({
    queryKey: ['department-chart'],
    queryFn: () => apiClient.getChartData('departments'),
  })

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  const mockUserGrowth = [
    { month: 'Jan', users: 120 },
    { month: 'Feb', users: 132 },
    { month: 'Mar', users: 145 },
    { month: 'Apr', users: 161 },
    { month: 'May', users: 173 },
    { month: 'Jun', users: 180 },
  ]

  const mockDepartmentData = [
    { name: 'Engineering', value: 35, color: '#0088FE' },
    { name: 'Marketing', value: 20, color: '#00C49F' },
    { name: 'Sales', value: 25, color: '#FFBB28' },
    { name: 'HR', value: 10, color: '#FF8042' },
    { name: 'Finance', value: 10, color: '#8884D8' },
  ]

  const mockRecentActivities = [
    {
      id: '1',
      type: 'user_created',
      description: 'New employee John Doe joined Engineering team',
      userName: 'Sarah Wilson',
      timestamp: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      type: 'expense_submitted',
      description: 'Expense claim submitted for $250.00',
      userName: 'Mike Johnson',
      timestamp: '2024-01-15T09:15:00Z',
    },
    {
      id: '3',
      type: 'application_created',
      description: 'Leave application submitted for review',
      userName: 'Emily Brown',
      timestamp: '2024-01-15T08:45:00Z',
    },
    {
      id: '4',
      type: 'announcement_posted',
      description: 'New company announcement posted',
      userName: 'Admin',
      timestamp: '2024-01-14T16:20:00Z',
    },
  ]

  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="ROLE_ADMIN">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Title level={2} className="!mb-2 !text-gray-900 dark:!text-white">
                {t('dashboard.admin.title')}
              </Title>
              <Text className="text-gray-500 dark:text-gray-400">
                {t('dashboard.welcome')}
              </Text>
            </div>
          </div>

          {/* Stats Cards */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card className="card-hover bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <Statistic
                  title={t('dashboard.admin.totalEmployees')}
                  value={stats?.totalUsers || 180}
                  prefix={<UserOutlined className="text-blue-500" />}
                  loading={statsLoading}
                  valueStyle={{ color: 'inherit' }}
                />
                <div className="mt-2">
                  <Text type="success" className="text-xs">
                    <RiseOutlined /> {t('dashboard.admin.lastMonth')}
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="card-hover bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <Statistic
                  title={t('dashboard.admin.activeDepartments')}
                  value={stats?.totalDepartments || 5}
                  prefix={<TeamOutlined className="text-green-500" />}
                  loading={statsLoading}
                  valueStyle={{ color: 'inherit' }}
                />
                <div className="mt-2">
                  <Text type="success" className="text-xs">
                    <RiseOutlined /> {t('dashboard.admin.thisQuarter')}
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="card-hover bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <Statistic
                  title={t('dashboard.admin.pendingApplications')}
                  value={stats?.pendingApplications || 8}
                  prefix={<FileTextOutlined className="text-orange-500" />}
                  loading={statsLoading}
                  valueStyle={{ color: 'inherit' }}
                />
                <div className="mt-2">
                  <Text type="warning" className="text-xs">
                    <CalendarOutlined /> {t('dashboard.admin.urgentAttention')}
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="card-hover bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <Statistic
                  title={t('dashboard.admin.totalExpenses')}
                  value={stats?.totalExpenses || 15420}
                  prefix={<DollarOutlined className="text-purple-500" />}
                  formatter={(value) => formatCurrency(Number(value))}
                  loading={statsLoading}
                  valueStyle={{ color: 'inherit' }}
                />
                <div className="mt-2">
                  <Text type="success" className="text-xs">
                    <RiseOutlined /> -8% {t('dashboard.admin.lastMonth')}
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Charts Row */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title={t('dashboard.userGrowthTrend')} className="h-96 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={mockUserGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: 'rgb(31 41 55)', border: '1px solid rgb(55 65 81)', color: 'rgb(229 231 235)' }} />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ fill: '#2563eb' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title={t('dashboard.departmentDistribution')} className="h-96 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={mockDepartmentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {mockDepartmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'rgb(31 41 55)', border: '1px solid rgb(55 65 81)', color: 'rgb(229 231 235)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* Recent Activities and Quick Actions */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title={t('dashboard.recentActivities')} className="h-96 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <List
                  loading={activitiesLoading}
                  dataSource={mockRecentActivities}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<UserOutlined />} className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400" />}
                        title={<span className="text-gray-900 dark:text-gray-100">{item.description}</span>}
                        description={<span className="text-gray-500 dark:text-gray-400">{`${item.userName} • ${formatDate(item.timestamp)}`}</span>}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title={t('dashboard.quickActions')} className="h-96 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center space-x-3">
                      <UserOutlined className="text-blue-600 dark:text-blue-400 text-xl" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{t('dashboard.admin.addNewEmployee')}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.teamMembers')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center space-x-3">
                      <FileTextOutlined className="text-green-600 dark:text-green-400 text-xl" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{t('dashboard.admin.reviewApplications')}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">8 {t('dashboard.manager.pendingApprovals')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center space-x-3">
                      <NotificationOutlined className="text-purple-600 dark:text-purple-400 text-xl" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{t('dashboard.admin.sendAnnouncement')}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.announcements')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center space-x-3">
                      <DollarOutlined className="text-orange-600 dark:text-orange-400 text-xl" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{t('dashboard.admin.expenseReports')}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.reports')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}