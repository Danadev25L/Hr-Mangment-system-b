'use client'

import React from 'react'
import { Row, Col, Card, Statistic, List, Progress, Avatar, Typography, Table } from 'antd'
import {
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  RiseOutlined,
  CalendarOutlined,
  UserOutlined,
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

export default function ManagerDashboard() {
  const { data: teamStats, isLoading } = useQuery({
    queryKey: ['team-stats'],
    queryFn: () => Promise.resolve({
      totalTeamMembers: 15,
      activeProjects: 8,
      pendingApprovals: 5,
      teamExpenses: 8750,
    }),
  })

  const mockTeamMembers = [
    {
      id: '1',
      name: 'Alice Johnson',
      role: 'Senior Developer',
      avatar: null,
      status: 'active',
      performance: 92,
      currentProject: 'E-commerce Platform',
    },
    {
      id: '2',
      name: 'Bob Smith',
      role: 'UI/UX Designer',
      avatar: null,
      status: 'active',
      performance: 88,
      currentProject: 'Mobile App Redesign',
    },
    {
      id: '3',
      name: 'Carol White',
      role: 'Backend Developer',
      avatar: null,
      status: 'active',
      performance: 85,
      currentProject: 'API Development',
    },
    {
      id: '4',
      name: 'David Brown',
      role: 'Frontend Developer',
      avatar: null,
      status: 'on_leave',
      performance: 90,
      currentProject: 'Dashboard Updates',
    },
    {
      id: '5',
      name: 'Eva Davis',
      role: 'QA Engineer',
      avatar: null,
      status: 'active',
      performance: 87,
      currentProject: 'Testing Suite',
    },
  ]

  const mockPendingApprovals = [
    {
      id: '1',
      type: 'leave',
      employee: 'Alice Johnson',
      description: 'Annual leave request',
      amount: null,
      date: '2024-01-20',
      priority: 'medium',
    },
    {
      id: '2',
      type: 'expense',
      employee: 'Bob Smith',
      description: 'Conference travel expenses',
      amount: 1250,
      date: '2024-01-19',
      priority: 'high',
    },
    {
      id: '3',
      type: 'expense',
      employee: 'Carol White',
      description: 'Software license renewal',
      amount: 450,
      date: '2024-01-18',
      priority: 'low',
    },
    {
      id: '4',
      type: 'leave',
      employee: 'David Brown',
      description: 'Medical leave',
      amount: null,
      date: '2024-01-17',
      priority: 'high',
    },
  ]

  const mockPerformanceData = [
    { month: 'Jan', teamPerformance: 85, individualAvg: 82 },
    { month: 'Feb', teamPerformance: 88, individualAvg: 85 },
    { month: 'Mar', teamPerformance: 92, individualAvg: 87 },
    { month: 'Apr', teamPerformance: 90, individualAvg: 86 },
    { month: 'May', teamPerformance: 94, individualAvg: 89 },
    { month: 'Jun', teamPerformance: 91, individualAvg: 88 },
  ]

  const mockProjectDistribution = [
    { name: 'Development', value: 40, color: '#0088FE' },
    { name: 'Design', value: 25, color: '#00C49F' },
    { name: 'Testing', value: 20, color: '#FFBB28' },
    { name: 'Planning', value: 15, color: '#FF8042' },
  ]

  const teamColumns = [
    {
      title: 'Team Member',
      key: 'member',
      render: (_, record: any) => (
        <div className="flex items-center space-x-3">
          <Avatar
            src={record.avatar}
            icon={<UserOutlined />}
            className="bg-primary-100 text-primary-600"
          />
          <div>
            <p className="font-medium text-gray-900">{record.name}</p>
            <p className="text-sm text-gray-500">{record.role}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Performance',
      dataIndex: 'performance',
      key: 'performance',
      render: (performance: number) => (
        <div className="flex items-center space-x-2">
          <Progress
            percent={performance}
            size="small"
            strokeColor={performance >= 90 ? '#52c41a' : performance >= 80 ? '#1890ff' : '#faad14'}
            showInfo={false}
            className="w-20"
          />
          <span className="text-sm font-medium">{performance}%</span>
        </div>
      ),
    },
    {
      title: 'Current Project',
      dataIndex: 'currentProject',
      key: 'currentProject',
      render: (project: string) => (
        <span className="text-sm text-gray-600">{project}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          active: 'green',
          on_leave: 'orange',
          inactive: 'red',
        }
        return (
          <span className={`px-2 py-1 text-xs rounded-full bg-${colors[status as keyof typeof colors]}-100 text-${colors[status as keyof typeof colors]}-800 capitalize`}>
            {status.replace('_', ' ')}
          </span>
        )
      },
    },
  ]

  return (
    <DashboardLayout role="ROLE_MANAGER">
      <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Title level={2} className="!mb-2">
                Manager Dashboard
              </Title>
              <Text className="text-gray-500">
                Manage your team and track performance metrics
              </Text>
            </div>
          </div>

          {/* Stats Cards */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card className="card-hover">
                <Statistic
                  title="Team Members"
                  value={teamStats?.totalTeamMembers || 15}
                  prefix={<TeamOutlined className="text-blue-500" />}
                  loading={isLoading}
                />
                <div className="mt-2">
                  <Text type="success" className="text-xs">
                    <RiseOutlined /> All active
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="card-hover">
                <Statistic
                  title="Active Projects"
                  value={teamStats?.activeProjects || 8}
                  prefix={<CheckCircleOutlined className="text-green-500" />}
                  loading={isLoading}
                />
                <div className="mt-2">
                  <Text type="success" className="text-xs">
                    <RiseOutlined /> 2 ahead of schedule
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="card-hover">
                <Statistic
                  title="Pending Approvals"
                  value={teamStats?.pendingApprovals || 5}
                  prefix={<ClockCircleOutlined className="text-orange-500" />}
                  loading={isLoading}
                />
                <div className="mt-2">
                  <Text type="warning" className="text-xs">
                    <CalendarOutlined /> 2 require attention
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="card-hover">
                <Statistic
                  title="Team Expenses"
                  value={teamStats?.teamExpenses || 8750}
                  prefix={<DollarOutlined className="text-purple-500" />}
                  formatter={(value) => formatCurrency(Number(value))}
                  loading={isLoading}
                />
                <div className="mt-2">
                  <Text type="success" className="text-xs">
                    <RiseOutlined /> Within budget
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Performance Charts */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="Team Performance Trend" className="h-96">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={mockPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[80, 100]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="teamPerformance"
                      stroke="#2563eb"
                      strokeWidth={2}
                      name="Team Performance"
                    />
                    <Line
                      type="monotone"
                      dataKey="individualAvg"
                      stroke="#52c41a"
                      strokeWidth={2}
                      name="Individual Average"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Project Distribution" className="h-96">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={mockProjectDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {mockProjectDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* Team Members and Pending Approvals */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="Team Members" className="h-96">
                <Table
                  columns={teamColumns}
                  dataSource={mockTeamMembers}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Pending Approvals" className="h-96">
                <List
                  dataSource={mockPendingApprovals}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <span
                          key="priority"
                          className={`text-xs px-2 py-1 rounded ${
                            item.priority === 'high'
                              ? 'bg-red-100 text-red-800'
                              : item.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {item.priority}
                        </span>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            icon={item.type === 'expense' ? <DollarOutlined /> : <CalendarOutlined />}
                            className={item.type === 'expense' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}
                          />
                        }
                        title={
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{item.employee}</span>
                            {item.amount && (
                              <span className="text-sm text-green-600 font-medium">
                                {formatCurrency(item.amount)}
                              </span>
                            )}
                          </div>
                        }
                        description={
                          <div>
                            <p className="text-xs text-gray-600">{item.description}</p>
                            <p className="text-xs text-gray-400">{formatDate(item.date)}</p>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
      </div>
    </DashboardLayout>
  )
}