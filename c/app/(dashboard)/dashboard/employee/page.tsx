'use client';

import { Card, Typography, Row, Col, Statistic, Badge, Button, Space, List, Avatar, Progress, Timeline } from 'antd';
import { 
  ClockCircleOutlined, 
  CalendarOutlined, 
  CheckCircleOutlined, 
  FileTextOutlined,
  UserOutlined,
  StarOutlined,
  BellOutlined,
  TrophyOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function EmployeeDashboard() {
  // Mock data for employee dashboard
  const personalStats = {
    hoursWorked: 168,
    tasksCompleted: 23,
    leaveBalance: 15,
    performanceScore: 4.2
  };

  const upcomingTasks = [
    {
      id: 1,
      title: 'Complete project documentation',
      dueDate: 'Today, 5:00 PM',
      priority: 'High',
      status: 'In Progress'
    },
    {
      id: 2,
      title: 'Review design mockups',
      dueDate: 'Tomorrow, 2:00 PM', 
      priority: 'Medium',
      status: 'Pending'
    },
    {
      id: 3,
      title: 'Attend team meeting',
      dueDate: 'Friday, 10:00 AM',
      priority: 'Low',
      status: 'Scheduled'
    }
  ];

  const recentActivities = [
    {
      time: '1 hour ago',
      title: 'Submitted timesheet for approval',
      color: 'blue'
    },
    {
      time: '3 hours ago',
      title: 'Completed task: UI Component Review',
      color: 'green'
    },
    {
      time: '1 day ago',
      title: 'Applied for annual leave',
      color: 'orange'
    },
    {
      time: '2 days ago',
      title: 'Updated personal profile',
      color: 'purple'
    }
  ];

  const announcements = [
    {
      id: 1,
      title: 'New HR Policy Updates',
      content: 'Please review the updated remote work policy...',
      date: '2 hours ago',
      type: 'important'
    },
    {
      id: 2,
      title: 'Team Building Event',
      content: 'Join us for the quarterly team building event...',
      date: '1 day ago',
      type: 'event'
    },
    {
      id: 3,
      title: 'System Maintenance',
      content: 'Scheduled maintenance on Saturday from 2-4 AM...',
      date: '2 days ago',
      type: 'info'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return '#ff4d4f';
      case 'Medium': return '#faad14';
      case 'Low': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <Title level={2} className="mb-2">Employee Dashboard</Title>
        <Text type="secondary">Welcome back! Here&apos;s your personal workspace overview</Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Hours This Month"
              value={personalStats.hoursWorked}
              suffix="hrs"
              prefix={<ClockCircleOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tasks Completed"
              value={personalStats.tasksCompleted}
              prefix={<CheckCircleOutlined className="text-green-500" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Leave Balance"
              value={personalStats.leaveBalance}
              suffix="days"
              prefix={<CalendarOutlined className="text-orange-500" />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Performance"
              value={personalStats.performanceScore}
              suffix="/ 5.0"
              prefix={<StarOutlined className="text-purple-500" />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={[16, 16]}>
        {/* Quick Actions */}
        <Col xs={24} lg={8}>
          <Card title="Quick Actions">
            <Space direction="vertical" className="w-full" size="middle">
              <Button 
                type="primary" 
                icon={<ClockCircleOutlined />} 
                block
                className="h-12"
              >
                Clock In / Out
              </Button>
              <Button 
                icon={<CalendarOutlined />} 
                block
                className="h-12"
              >
                Request Leave
              </Button>
              <Button 
                icon={<FileTextOutlined />} 
                block
                className="h-12"
              >
                Submit Timesheet
              </Button>
              <Button 
                icon={<UserOutlined />} 
                block
                className="h-12"
              >
                Update Profile
              </Button>
            </Space>
          </Card>
        </Col>

        {/* Upcoming Tasks */}
        <Col xs={24} lg={8}>
          <Card 
            title={
              <Space>
                <CheckCircleOutlined />
                Upcoming Tasks
              </Space>
            }
            extra={<Button type="link">View All</Button>}
          >
            <List
              dataSource={upcomingTasks}
              renderItem={(task) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>{task.title}</Text>
                        <Badge 
                          color={getPriorityColor(task.priority)} 
                          text={task.priority}
                        />
                      </Space>
                    }
                    description={
                      <div>
                        <Text type="secondary">{task.dueDate}</Text>
                        <br />
                        <Badge status="processing" text={task.status} />
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Performance Overview */}
        <Col xs={24} lg={8}>
          <Card title="This Month's Progress">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <Text>Tasks Progress</Text>
                  <Text strong>23/30</Text>
                </div>
                <Progress percent={77} strokeColor="#52c41a" />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <Text>Hours Target</Text>
                  <Text strong>168/180</Text>
                </div>
                <Progress percent={93} strokeColor="#1890ff" />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <Text>Goals Achieved</Text>
                  <Text strong>4/5</Text>
                </div>
                <Progress percent={80} strokeColor="#722ed1" />
              </div>
              
              <div className="pt-2 border-t">
                <Space>
                  <TrophyOutlined className="text-yellow-500" />
                  <Text strong>Great work this month!</Text>
                </Space>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Bottom Row */}
      <Row gutter={[16, 16]}>
        {/* Recent Activities */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <ClockCircleOutlined />
                Recent Activities
              </Space>
            }
          >
            <Timeline
              items={recentActivities.map(activity => ({
                color: activity.color,
                children: (
                  <div>
                    <Text>{activity.title}</Text>
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

        {/* Announcements */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <BellOutlined />
                Company Announcements
              </Space>
            }
            extra={<Button type="link">View All</Button>}
          >
            <List
              dataSource={announcements}
              renderItem={(announcement) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        style={{ 
                          backgroundColor: announcement.type === 'important' ? '#ff4d4f' : 
                                           announcement.type === 'event' ? '#52c41a' : '#1890ff' 
                        }}
                      >
                        <BellOutlined />
                      </Avatar>
                    }
                    title={announcement.title}
                    description={
                      <div>
                        <Text>{announcement.content}</Text>
                        <br />
                        <Text type="secondary" className="text-sm">
                          {announcement.date}
                        </Text>
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
  );
}