'use client'

// Fixed compilation issues
import React from 'react'
import { Row, Col, Card, Statistic, Typography, List, Avatar } from 'antd'
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
              <Title level={2} className="!mb-2">
                Admin Dashboard
              </Title>
              <Text className="text-gray-500">
                Welcome back! Here&apos;s what&apos;s happening with your team today.
              </Text>
            </div>
          </div>

          {/* Stats Cards */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card className="card-hover">
                <Statistic
                  title="Total Employees"
                  value={stats?.totalUsers || 180}
                  prefix={<UserOutlined className="text-blue-500" />}
                  loading={statsLoading}
                />
                <div className="mt-2">
                  <Text type="success" className="text-xs">
                    <RiseOutlined /> +12% from last month
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="card-hover">
                <Statistic
                  title="Active Departments"
                  value={stats?.totalDepartments || 5}
                  prefix={<TeamOutlined className="text-green-500" />}
                  loading={statsLoading}
                />
                <div className="mt-2">
                  <Text type="success" className="text-xs">
                    <RiseOutlined /> +2 new this quarter
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="card-hover">
                <Statistic
                  title="Pending Applications"
                  value={stats?.pendingApplications || 8}
                  prefix={<FileTextOutlined className="text-orange-500" />}
                  loading={statsLoading}
                />
                <div className="mt-2">
                  <Text type="warning" className="text-xs">
                    <CalendarOutlined /> 3 require urgent attention
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="card-hover">
                <Statistic
                  title="Total Expenses"
                  value={stats?.totalExpenses || 15420}
                  prefix={<DollarOutlined className="text-purple-500" />}
                  formatter={(value) => formatCurrency(Number(value))}
                  loading={statsLoading}
                />
                <div className="mt-2">
                  <Text type="success" className="text-xs">
                    <RiseOutlined /> -8% from last month
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Charts Row */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="User Growth Trend" className="h-96">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={mockUserGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
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
              <Card title="Department Distribution" className="h-96">
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
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* Recent Activities and Quick Actions */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="Recent Activities" className="h-96">
                <List
                  loading={activitiesLoading}
                  dataSource={mockRecentActivities}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<UserOutlined />} />}
                        title={item.description}
                        description={`${item.userName} • ${formatDate(item.timestamp)}`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Quick Actions" className="h-96">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <UserOutlined className="text-blue-600 text-xl" />
                      <div>
                        <p className="font-medium text-gray-900">Add New Employee</p>
                        <p className="text-sm text-gray-500">Onboard team members</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <FileTextOutlined className="text-green-600 text-xl" />
                      <div>
                        <p className="font-medium text-gray-900">Review Applications</p>
                        <p className="text-sm text-gray-500">8 pending requests</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center space-x-3">
                      <NotificationOutlined className="text-purple-600 text-xl" />
                      <div>
                        <p className="font-medium text-gray-900">Send Announcement</p>
                        <p className="text-sm text-gray-500">Company-wide updates</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center space-x-3">
                      <DollarOutlined className="text-orange-600 text-xl" />
                      <div>
                        <p className="font-medium text-gray-900">Expense Reports</p>
                        <p className="text-sm text-gray-500">View monthly spending</p>
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