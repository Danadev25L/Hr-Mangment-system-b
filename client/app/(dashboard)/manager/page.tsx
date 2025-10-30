'use client';

import React from 'react';
import { Card, Row, Col, Statistic, Typography, Space, List } from 'antd';
import {
  TeamOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { RoleSwitcher } from '@/src/components/RoleSwitcher';
import { useAuthStore } from '@/src/store/useAuthStore';

const { Title, Paragraph } = Typography;

export default function ManagerDashboard() {
  const { user } = useAuthStore();

  const recentApplications = [
    { id: 1, employee: 'John Doe', type: 'Leave Request', status: 'Pending' },
    { id: 2, employee: 'Jane Smith', type: 'Overtime', status: 'Approved' },
    { id: 3, employee: 'Bob Johnson', type: 'Expense Claim', status: 'Pending' },
  ];

  return (
    <div>
      <RoleSwitcher />
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>Manager Dashboard</Title>
          <Paragraph type="secondary">
            Welcome back, {user?.name}! Manage your team effectively.
          </Paragraph>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Team Members"
                value={15}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Pending Applications"
                value={5}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Approved This Month"
                value={12}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Active Job Postings"
                value={3}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        <Card title="Recent Applications">
          <List
            dataSource={recentApplications}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={`${item.employee} - ${item.type}`}
                  description={`Status: ${item.status}`}
                />
              </List.Item>
            )}
          />
        </Card>

        <Card title="Backend Integration">
          <Paragraph>
            This dashboard integrates with the following manager endpoints:
          </Paragraph>
          <ul>
            <li><code>GET /api/manager/employees</code> - Department employees</li>
            <li><code>GET /api/manager/applications</code> - Department applications</li>
            <li><code>GET /api/manager/applications/recent</code> - Recent applications</li>
            <li><code>GET /api/manager/jobs</code> - Department jobs</li>
            <li><code>GET /api/manager/announcements</code> - Department announcements</li>
          </ul>
        </Card>
      </Space>
    </div>
  );
}
