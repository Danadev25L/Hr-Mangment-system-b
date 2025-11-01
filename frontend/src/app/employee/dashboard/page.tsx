'use client'

import React from 'react'
import { Row, Col, Card, Statistic, List, Typography, Progress, Avatar, Timeline, Button } from 'antd'
import {
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
  DollarOutlined,
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  GiftOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useQuery } from '@tanstack/react-query'
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

export default function EmployeeDashboard() {
  const { data: employeeData, isLoading } = useQuery({
    queryKey: ['employee-data'],
    queryFn: () => Promise.resolve({
      name: 'John Doe',
      role: 'Senior Developer',
      department: 'Engineering',
      joinDate: '2022-03-15',
      performance: 92,
      remainingLeave: 12,
      pendingExpenses: 2,
      totalExpenses: 3250,
    }),
  })

  const mockRecentActivity = [
    {
      id: '1',
      type: 'expense_approved',
      description: 'Your expense claim for $250 has been approved',
      timestamp: '2024-01-15T10:30:00Z',
      icon: <DollarOutlined className="text-green-500" />,
    },
    {
      id: '2',
      type: 'announcement',
      description: 'New company policy update: Remote work guidelines',
      timestamp: '2024-01-14T14:20:00Z',
      icon: <BellOutlined className="text-blue-500" />,
    },
    {
      id: '3',
      type: 'leave_approved',
      description: 'Your leave request for Jan 25-26 has been approved',
      timestamp: '2024-01-13T09:15:00Z',
      icon: <CheckCircleOutlined className="text-green-500" />,
    },
    {
      id: '4',
      type: 'performance_review',
      description: 'Performance review scheduled for next week',
      timestamp: '2024-01-12T16:45:00Z',
      icon: <TrophyOutlined className="text-purple-500" />,
    },
  ]

  const mockUpcomingEvents = [
    {
      id: '1',
      title: 'Team Meeting',
      date: '2024-01-18',
      time: '10:00 AM',
      type: 'meeting',
    },
    {
      id: '2',
      title: 'Performance Review',
      date: '2024-01-22',
      time: '2:00 PM',
      type: 'review',
    },
    {
      id: '3',
      title: 'Project Deadline',
      date: '2024-01-25',
      time: '5:00 PM',
      type: 'deadline',
    },
    {
      id: '4',
      title: 'Team Building Event',
      date: '2024-01-28',
      time: '3:00 PM',
      type: 'event',
    },
  ]

  const mockPerformanceData = [
    { month: 'Jan', performance: 85, target: 90 },
    { month: 'Feb', performance: 88, target: 90 },
    { month: 'Mar', performance: 92, target: 90 },
    { month: 'Apr', performance: 90, target: 90 },
    { month: 'May', performance: 94, target: 90 },
    { month: 'Jun', performance: 92, target: 90 },
  ]

  const mockLeaveData = [
    { name: 'Used', value: 8, color: '#ff4d4f' },
    { name: 'Remaining', value: 12, color: '#52c41a' },
    { name: 'Pending', value: 2, color: '#faad14' },
  ]

  const quickActions = [
    {
      title: 'Request Leave',
      description: 'Apply for time off',
      icon: <CalendarOutlined className="text-blue-500 text-xl" />,
      color: 'bg-blue-50 border-blue-200',
      action: () => {},
    },
    {
      title: 'Submit Expense',
      description: 'Claim reimbursement',
      icon: <DollarOutlined className="text-green-500 text-xl" />,
      color: 'bg-green-50 border-green-200',
      action: () => {},
    },
    {
      title: 'View Profile',
      description: 'Update personal info',
      icon: <UserOutlined className="text-purple-500 text-xl" />,
      color: 'bg-purple-50 border-purple-200',
      action: () => {},
    },
    {
      title: 'Team Directory',
      description: 'Find colleagues',
      icon: <FileTextOutlined className="text-orange-500 text-xl" />,
      color: 'bg-orange-50 border-orange-200',
      action: () => {},
    },
  ]

  return (
    <DashboardLayout role="ROLE_EMPLOYEE">
      <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Title level={2} className="!mb-2">
                Welcome back, {employeeData?.name}!
              </Title>
              <Text className="text-gray-500">
                Here&apos;s what&apos;s happening with your work today.
              </Text>
            </div>
            <div className="flex items-center space-x-3">
              <Avatar
                size="large"
                icon={<UserOutlined />}
                className="bg-primary-100 text-primary-600"
              />
              <div className="text-right">
                <p className="font-medium text-gray-900">{employeeData?.name}</p>
                <p className="text-sm text-gray-500">{employeeData?.role}</p>
              </div>
            </div>
          </div>

          {/* Personal Stats Cards */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card className="card-hover">
                <Statistic
                  title="Performance Score"
                  value={employeeData?.performance || 92}
                  suffix="%"
                  prefix={<TrophyOutlined className="text-yellow-500" />}
                  loading={isLoading}
                />
                <div className="mt-2">
                  <Progress
                    percent={employeeData?.performance || 92}
                    size="small"
                    strokeColor="#52c41a"
                    showInfo={false}
                  />
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="card-hover">
                <Statistic
                  title="Leave Balance"
                  value={employeeData?.remainingLeave || 12}
                  suffix="days"
                  prefix={<CalendarOutlined className="text-blue-500" />}
                  loading={isLoading}
                />
                <div className="mt-2">
                  <Text type="success" className="text-xs">
                    <CheckCircleOutlined /> 2 requests pending
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="card-hover">
                <Statistic
                  title="Pending Expenses"
                  value={employeeData?.pendingExpenses || 2}
                  prefix={<DollarOutlined className="text-green-500" />}
                  loading={isLoading}
                />
                <div className="mt-2">
                  <Text type="warning" className="text-xs">
                    <ClockCircleOutlined /> $750 pending
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="card-hover">
                <Statistic
                  title="Total Expenses"
                  value={employeeData?.totalExpenses || 3250}
                  prefix={<DollarOutlined className="text-purple-500" />}
                  formatter={(value) => formatCurrency(Number(value))}
                  loading={isLoading}
                />
                <div className="mt-2">
                  <Text type="success" className="text-xs">
                    <RiseOutlined /> This year
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Performance and Leave Charts */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="Performance Trend" className="h-96">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={mockPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[80, 100]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="performance"
                      stroke="#2563eb"
                      strokeWidth={2}
                      name="Your Performance"
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke="#52c41a"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Target"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Leave Status" className="h-96">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={mockLeaveData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value} days`}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {mockLeaveData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Total Leave Days:</span>
                    <span className="font-medium">20 days</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Used:</span>
                    <span className="text-red-600 font-medium">8 days</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Remaining:</span>
                    <span className="text-green-600 font-medium">12 days</span>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Quick Actions, Recent Activity, and Upcoming Events */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={8}>
              <Card title="Quick Actions" className="h-96">
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map((action, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${action.color} cursor-pointer transition-all hover:shadow-md`}
                      onClick={action.action}
                    >
                      <div className="flex flex-col items-center space-y-2 text-center">
                        {action.icon}
                        <p className="font-medium text-gray-900 text-sm">{action.title}</p>
                        <p className="text-xs text-gray-500">{action.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Recent Activity" className="h-96">
                <List
                  dataSource={mockRecentActivity}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={item.icon}
                        description={
                          <div>
                            <p className="text-sm text-gray-900">{item.description}</p>
                            <p className="text-xs text-gray-400">{formatDate(item.timestamp)}</p>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Upcoming Events" className="h-96">
                <Timeline
                  items={mockUpcomingEvents.map((event) => ({
                    dot: <CalendarOutlined className="text-blue-500" />,
                    children: (
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{event.title}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(event.date)} at {event.time}
                        </p>
                      </div>
                    ),
                  }))}
                />
              </Card>
            </Col>
          </Row>

          {/* Announcements Section */}
          <Card title="Latest Announcements" extra={<Button type="link">View All</Button>}>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <BellOutlined className="text-blue-600 text-lg mt-1" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">New Remote Work Policy</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Starting next month, employees can work remotely up to 3 days per week. Please review the updated guidelines.
                    </p>
                    <p className="text-xs text-gray-400 mt-2">Posted 2 days ago by HR Department</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <GiftOutlined className="text-green-600 text-lg mt-1" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Team Building Event</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Join us for our quarterly team building event on January 28th. Activities, food, and fun for everyone!
                    </p>
                    <p className="text-xs text-gray-400 mt-2">Posted 5 days ago by Management</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
      </div>
    </DashboardLayout>
  )
}