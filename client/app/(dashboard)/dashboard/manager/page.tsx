'use client';

import { Card, Typography, Row, Col, Statistic, Timeline, Table, Button, Space, Badge } from 'antd';
import { 
  TeamOutlined, 
  CalendarOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  TrophyOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function ManagerDashboard() {
  // Mock data for manager dashboard
  const teamStats = {
    totalEmployees: 12,
    activeProjects: 5,
    pendingApprovals: 3,
    thisMonthHires: 2
  };

  const recentActivities = [
    {
      time: '2 hours ago',
      title: 'John Smith submitted leave request',
      status: 'pending',
      color: 'blue'
    },
    {
      time: '4 hours ago', 
      title: 'Project Alpha milestone completed',
      status: 'completed',
      color: 'green'
    },
    {
      time: '1 day ago',
      title: 'Sarah Johnson performance review due',
      status: 'pending',
      color: 'orange'
    },
    {
      time: '2 days ago',
      title: 'Team meeting scheduled for Friday',
      status: 'scheduled',
      color: 'purple'
    }
  ];

  const teamMembers = [
    {
      key: '1',
      name: 'John Smith',
      position: 'Senior Developer',
      department: 'Engineering',
      status: 'Active',
      lastActivity: '2 hours ago'
    },
    {
      key: '2', 
      name: 'Sarah Johnson',
      position: 'UI/UX Designer',
      department: 'Design',
      status: 'On Leave',
      lastActivity: '1 day ago'
    },
    {
      key: '3',
      name: 'Mike Wilson', 
      position: 'QA Engineer',
      department: 'Quality Assurance',
      status: 'Active',
      lastActivity: '1 hour ago'
    }
  ];

  const teamColumns = [
    {
      title: 'Employee',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <UserOutlined />
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge 
          status={status === 'Active' ? 'success' : 'warning'} 
          text={status}
        />
      ),
    },
    {
      title: 'Last Activity',
      dataIndex: 'lastActivity',
      key: 'lastActivity',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button type="link" size="small">View</Button>
          <Button type="link" size="small">Edit</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <Title level={2} className="mb-2">Manager Dashboard</Title>
        <Text type="secondary">Overview of your team and management tasks</Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Team Members"
              value={teamStats.totalEmployees}
              prefix={<TeamOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Projects"
              value={teamStats.activeProjects}
              prefix={<TrophyOutlined className="text-green-500" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Approvals"
              value={teamStats.pendingApprovals}
              prefix={<ClockCircleOutlined className="text-orange-500" />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="New Hires This Month"
              value={teamStats.thisMonthHires}
              prefix={<UserOutlined className="text-purple-500" />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={[16, 16]}>
        {/* Recent Activities */}
        <Col xs={24} lg={8}>
          <Card 
            title={
              <Space>
                <CalendarOutlined />
                Recent Activities
              </Space>
            }
            extra={<Button type="link">View All</Button>}
          >
            <Timeline
              items={recentActivities.map(activity => ({
                color: activity.color,
                children: (
                  <div>
                    <Text strong>{activity.title}</Text>
                    <br />
                    <Text type="secondary" className="text-sm">
                      {activity.time}
                    </Text>
                  </div>
                )
              }))}
            />
          </Card>
        </Col>

        {/* Quick Actions */}
        <Col xs={24} lg={8}>
          <Card title="Quick Actions">
            <Space direction="vertical" className="w-full" size="middle">
              <Button 
                type="primary" 
                icon={<UserOutlined />} 
                block
                className="h-12"
              >
                Manage Team Members
              </Button>
              <Button 
                icon={<CalendarOutlined />} 
                block
                className="h-12"
              >
                Schedule Team Meeting
              </Button>
              <Button 
                icon={<FileTextOutlined />} 
                block
                className="h-12"
              >
                Review Leave Requests
              </Button>
              <Button 
                icon={<CheckCircleOutlined />} 
                block
                className="h-12"
              >
                Approve Timesheets
              </Button>
            </Space>
          </Card>
        </Col>

        {/* Performance Overview */}
        <Col xs={24} lg={8}>
          <Card title="Team Performance">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Text>Project Completion Rate</Text>
                <Text strong className="text-green-600">85%</Text>
              </div>
              <div className="flex justify-between items-center">
                <Text>Average Task Time</Text>
                <Text strong className="text-blue-600">2.3 days</Text>
              </div>
              <div className="flex justify-between items-center">
                <Text>Team Satisfaction</Text>
                <Text strong className="text-purple-600">4.2/5</Text>
              </div>
              <div className="flex justify-between items-center">
                <Text>On-time Delivery</Text>
                <Text strong className="text-orange-600">92%</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Team Members Table */}
      <Card 
        title={
          <Space>
            <TeamOutlined />
            Your Team Members
          </Space>
        }
        extra={
          <Space>
            <Button type="primary">Add Member</Button>
            <Button>Export</Button>
          </Space>
        }
      >
        <Table
          columns={teamColumns}
          dataSource={teamMembers}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
}