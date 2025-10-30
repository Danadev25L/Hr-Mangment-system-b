'use client';

import React from 'react';
import { Card, Row, Col, Statistic, Typography, Space } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { RoleSwitcher } from '@/src/components/RoleSwitcher';
import { useAuthStore } from '@/src/store/useAuthStore';

const { Title, Paragraph } = Typography;

export default function AdminDashboard() {
  const { user } = useAuthStore();

  return (
    <div>
      <RoleSwitcher />
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>Admin Dashboard</Title>
          <Paragraph type="secondary">
            Welcome back, {user?.name}! Heres your organization overview.
          </Paragraph>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Users"
                value={150}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Departments"
                value={8}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Monthly Payroll"
                value={450000}
                prefix={<DollarOutlined />}
                precision={2}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Pending Applications"
                value={23}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        <Card title="Quick Actions">
          <Paragraph>
            • Manage Users: Add, edit, or remove user accounts
            <br />
            • Department Management: Organize your teams
            <br />
            • Process Payroll: Generate monthly payroll
            <br />
            • Review Applications: Approve or reject employee requests
          </Paragraph>
        </Card>

        <Card title="Backend Integration">
          <Paragraph>
            This dashboard integrates with the following admin endpoints:
          </Paragraph>
          <ul>
            <li><code>GET /api/admin/users/statistics</code> - User statistics</li>
            <li><code>GET /api/admin/departments/statistics</code> - Department stats</li>
            <li><code>GET /api/admin/payroll/summary</code> - Payroll summary</li>
            <li><code>GET /api/admin/applications</code> - All applications</li>
            <li><code>GET /api/admin/payments/year/:year</code> - Payment analytics</li>
          </ul>
        </Card>
      </Space>
    </div>
  );
}
