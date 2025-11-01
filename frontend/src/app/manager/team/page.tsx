'use client'

import React, { useState } from 'react'
import {
  Table,
  Card,
  Button,
  Input,
  Avatar,
  Progress,
  Tag,
  Dropdown,
  Modal,
  Form,
  message,
  Select,
  Rate,
  Space,
  Statistic,
  Row,
  Col,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  MoreOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EditOutlined,
  TrophyOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { useQuery } from '@tanstack/react-query'
import { formatDate } from '@/lib/utils'
import type { ColumnsType } from 'antd/es/table'

const { Search } = Input
const { Option } = Select

interface TeamMember {
  id: string
  name: string
  email: string
  phone: string
  role: string
  department: string
  status: 'active' | 'on_leave' | 'inactive'
  performance: number
  projects: number
  joinDate: string
  skills: string[]
  avatar?: string
}

export default function TeamPage() {
  const [searchText, setSearchText] = useState('')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [performanceModalVisible, setPerformanceModalVisible] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [form] = Form.useForm()

  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => Promise.resolve([
      {
        id: '1',
        name: 'Alice Johnson',
        email: 'alice.johnson@company.com',
        phone: '+1 (555) 123-4567',
        role: 'Senior Developer',
        department: 'Engineering',
        status: 'active',
        performance: 92,
        projects: 5,
        joinDate: '2022-03-15',
        skills: ['React', 'Node.js', 'TypeScript', 'AWS'],
      },
      {
        id: '2',
        name: 'Bob Smith',
        email: 'bob.smith@company.com',
        phone: '+1 (555) 234-5678',
        role: 'UI/UX Designer',
        department: 'Design',
        status: 'active',
        performance: 88,
        projects: 3,
        joinDate: '2022-06-20',
        skills: ['Figma', 'Adobe XD', 'Sketch', 'Prototyping'],
      },
      {
        id: '3',
        name: 'Carol White',
        email: 'carol.white@company.com',
        phone: '+1 (555) 345-6789',
        role: 'Backend Developer',
        department: 'Engineering',
        status: 'active',
        performance: 85,
        projects: 4,
        joinDate: '2021-11-10',
        skills: ['Python', 'Django', 'PostgreSQL', 'Docker'],
      },
      {
        id: '4',
        name: 'David Brown',
        email: 'david.brown@company.com',
        phone: '+1 (555) 456-7890',
        role: 'Frontend Developer',
        department: 'Engineering',
        status: 'on_leave',
        performance: 90,
        projects: 4,
        joinDate: '2022-01-05',
        skills: ['Vue.js', 'JavaScript', 'CSS', 'Git'],
      },
      {
        id: '5',
        name: 'Eva Davis',
        email: 'eva.davis@company.com',
        phone: '+1 (555) 567-8901',
        role: 'QA Engineer',
        department: 'Quality',
        status: 'active',
        performance: 87,
        projects: 6,
        joinDate: '2022-09-12',
        skills: ['Selenium', 'Jest', 'Cypress', 'Manual Testing'],
      },
      {
        id: '6',
        name: 'Frank Miller',
        email: 'frank.miller@company.com',
        phone: '+1 (555) 678-9012',
        role: 'DevOps Engineer',
        department: 'Engineering',
        status: 'active',
        performance: 89,
        projects: 3,
        joinDate: '2021-08-18',
        skills: ['Kubernetes', 'Jenkins', 'Terraform', 'CI/CD'],
      },
    ]),
  })

  const handlePerformanceReview = (member: TeamMember) => {
    setSelectedMember(member)
    setPerformanceModalVisible(true)
  }

  const handlePerformanceSubmit = async (values: any) => {
    try {
      // Here you would submit the performance review
      message.success('Performance review submitted successfully')
      setPerformanceModalVisible(false)
      setSelectedMember(null)
    } catch (error) {
      message.error('Failed to submit performance review')
    }
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return '#52c41a'
    if (score >= 80) return '#1890ff'
    if (score >= 70) return '#faad14'
    return '#ff4d4f'
  }

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'green',
      on_leave: 'orange',
      inactive: 'red',
    }
    return colors[status as keyof typeof colors] || 'default'
  }

  const columns: ColumnsType<TeamMember> = [
    {
      title: 'Team Member',
      key: 'member',
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <Avatar
            src={record.avatar}
            icon={<UserOutlined />}
            className="bg-primary-100 text-primary-600"
          >
            {record.name.split(' ').map(n => n[0]).join('')}
          </Avatar>
          <div>
            <p className="font-medium text-gray-900">{record.name}</p>
            <p className="text-sm text-gray-500">{record.role}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-1">
            <MailOutlined className="text-gray-400 text-xs" />
            <span className="text-xs text-gray-600">{record.email}</span>
          </div>
          <div className="flex items-center space-x-1">
            <PhoneOutlined className="text-gray-400 text-xs" />
            <span className="text-xs text-gray-600">{record.phone}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Performance',
      dataIndex: 'performance',
      key: 'performance',
      render: (performance) => (
        <div className="flex items-center space-x-2">
          <Progress
            percent={performance}
            size="small"
            strokeColor={getPerformanceColor(performance)}
            showInfo={false}
            className="w-16"
          />
          <span className="text-sm font-medium" style={{ color: getPerformanceColor(performance) }}>
            {performance}%
          </span>
        </div>
      ),
      sorter: (a, b) => a.performance - b.performance,
    },
    {
      title: 'Projects',
      dataIndex: 'projects',
      key: 'projects',
      render: (projects) => (
        <div className="flex items-center space-x-2">
          <span className="font-medium">{projects}</span>
          <span className="text-xs text-gray-500">active</span>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} className="capitalize">
          {status.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'joinDate',
      key: 'joinDate',
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const items = [
          {
            key: 'view',
            icon: <UserOutlined />,
            label: 'View Profile',
            onClick: () => message.info('View profile functionality'),
          },
          {
            key: 'performance',
            icon: <TrophyOutlined />,
            label: 'Performance Review',
            onClick: () => handlePerformanceReview(record),
          },
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit Details',
            onClick: () => message.info('Edit functionality'),
          },
        ]

        return (
          <Dropdown
            menu={{ items }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        )
      },
    },
  ]

  const filteredTeamMembers = teamMembers?.filter(member =>
    member.name.toLowerCase().includes(searchText.toLowerCase()) ||
    member.email.toLowerCase().includes(searchText.toLowerCase()) ||
    member.role.toLowerCase().includes(searchText.toLowerCase())
  ) || []

  const teamStats = {
    total: teamMembers?.length || 0,
    active: teamMembers?.filter(m => m.status === 'active').length || 0,
    avgPerformance: teamMembers ? Math.round(teamMembers.reduce((acc, m) => acc + m.performance, 0) / teamMembers.length) : 0,
    totalProjects: teamMembers?.reduce((acc, m) => acc + m.projects, 0) || 0,
  }

  return (
    <ProtectedRoute requiredRole="manager">
      <DashboardLayout role="manager">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
              <p className="text-gray-500">Manage your team members and performance</p>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => message.info('Add team member functionality')}
            >
              Add Team Member
            </Button>
          </div>

          {/* Team Stats */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="Total Members"
                  value={teamStats.total}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="Active Members"
                  value={teamStats.active}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="Avg Performance"
                  value={teamStats.avgPerformance}
                  suffix="%"
                  valueStyle={{ color: teamStats.avgPerformance >= 85 ? '#3f8600' : '#cf1322' }}
                  prefix={<TrophyOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="Active Projects"
                  value={teamStats.totalProjects}
                  prefix={<EditOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* Search and Filters */}
          <Card>
            <div className="flex flex-col sm:flex-row gap-4">
              <Search
                placeholder="Search team members..."
                allowClear
                enterButton={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="flex-1"
              />
              <Select
                placeholder="Filter by status"
                allowClear
                style={{ width: 150 }}
              >
                <Option value="active">Active</Option>
                <Option value="on_leave">On Leave</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
              <Select
                placeholder="Filter by role"
                allowClear
                style={{ width: 200 }}
              >
                <Option value="developer">Developer</Option>
                <Option value="designer">Designer</Option>
                <Option value="qa">QA Engineer</Option>
                <Option value="devops">DevOps Engineer</Option>
              </Select>
            </div>
          </Card>

          {/* Team Members Table */}
          <Card>
            <Table
              columns={columns}
              dataSource={filteredTeamMembers}
              rowKey="id"
              loading={isLoading}
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `Showing ${range[0]} to ${range[1]} of ${total} team members`,
              }}
              scroll={{ x: 1200 }}
            />
          </Card>

          {/* Performance Review Modal */}
          <Modal
            title="Performance Review"
            open={performanceModalVisible}
            onCancel={() => {
              setPerformanceModalVisible(false)
              setSelectedMember(null)
            }}
            footer={null}
            width={600}
          >
            {selectedMember && (
              <Form
                form={form}
                layout="vertical"
                onFinish={handlePerformanceSubmit}
                initialValues={{
                  employee: selectedMember.name,
                  currentPerformance: selectedMember.performance,
                }}
              >
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">{selectedMember.name}</p>
                  <p className="text-sm text-gray-600">{selectedMember.role}</p>
                </div>

                <Form.Item
                  name="employee"
                  label="Employee"
                >
                  <Input disabled />
                </Form.Item>

                <Form.Item
                  name="currentPerformance"
                  label="Current Performance"
                >
                  <Input disabled />
                </Form.Item>

                <Form.Item
                  name="newPerformance"
                  label="Performance Rating"
                  rules={[{ required: true, message: 'Please rate performance' }]}
                >
                  <Rate />
                </Form.Item>

                <Form.Item
                  name="review"
                  label="Review Comments"
                  rules={[{ required: true, message: 'Please provide review comments' }]}
                >
                  <Input.TextArea rows={4} placeholder="Enter your review comments..." />
                </Form.Item>

                <Form.Item
                  name="goals"
                  label="Goals for Next Period"
                  rules={[{ required: true, message: 'Please set goals for next period' }]}
                >
                  <Input.TextArea rows={3} placeholder="Enter goals for next period..." />
                </Form.Item>

                <Form.Item className="mb-0">
                  <div className="flex justify-end space-x-2">
                    <Button onClick={() => setPerformanceModalVisible(false)}>
                      Cancel
                    </Button>
                    <Button type="primary" htmlType="submit">
                      Submit Review
                    </Button>
                  </div>
                </Form.Item>
              </Form>
            )}
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}