'use client';

import React from 'react';
import { Card, Row, Col, Statistic, Typography, Space, Timeline } from 'antd';
import {
  DollarOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { RoleSwitcher } from '@/src/components/RoleSwitcher';
import { useAuthStore } from '@/src/store/useAuthStore';

const { Title, Paragraph } = Typography;

export default function EmployeeDashboard() {
  const { user } = useAuthStore();

  return (
    <div>
      <RoleSwitcher />
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>My Dashboard</Title>
          <Paragraph type="secondary">
            Welcome back, {user?.name}! Here  s your personal overview.
          </Paragraph>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Current Salary"
                value={45000}
                prefix={<DollarOutlined />}
                precision={2}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="My Applications"
                value={8}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Overtime Hours"
                value={12}
                prefix={<ClockCircleOutlined />}
                suffix="hrs"
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Unread Notifications"
                value={3}
                prefix={<BellOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Recent Activities">
              <Timeline
                items={[
                  {
                    color: 'green',
                    children: 'Leave application approved - 2024-01-15',
                  },
                  {
                    color: 'blue',
                    children: 'Overtime request submitted - 2024-01-10',
                  },
                  {
                    color: 'gray',
                    children: 'Profile updated - 2024-01-05',
                  },
                ]}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Quick Actions">
              <Paragraph>
                • Submit new application
                <br />
                • Request overtime
                <br />
                • View salary history
                <br />
                • Update personal information
              </Paragraph>
            </Card>
          </Col>
        </Row>

        <Card title="Backend Integration">
          <Paragraph>
            This dashboard integrates with the following employee endpoints:
          </Paragraph>
          <ul>
            <li><code>GET /api/employee/profile</code> - My profile data</li>
            <li><code>GET /api/employee/salary-history</code> - Salary history</li>
            <li><code>GET /api/employee/applications</code> - My applications</li>
            <li><code>GET /api/employee/applications/stats</code> - Application statistics</li>
            <li><code>GET /api/employee/overtime</code> - Overtime records</li>
            <li><code>GET /api/employee/notifications</code> - My notifications</li>
          </ul>
        </Card>
      </Space>
    </div>
  );
}
