'use client';

import { useAuthGuard } from '@/src/middleware/auth';
import { Card, Row, Col, Statistic } from 'antd';
import { UserOutlined, BankOutlined, FileTextOutlined, DollarOutlined } from '@ant-design/icons';

export default function AdminAnalyticsPage() {
  const { isAuthenticated, loading } = useAuthGuard('admin');

  if (loading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics & Reports</h1>
      
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Departments"
              value={0}
              prefix={<BankOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Applications"
              value={0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Monthly Payroll"
              value={0}
              prefix={<DollarOutlined />}
              formatter={(value) => `$${Number(value).toLocaleString()}`}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div className="text-center py-16">
          <h3 className="text-lg text-gray-600">Analytics Dashboard</h3>
          <p className="text-gray-500">Detailed analytics and reporting features coming soon...</p>
        </div>
      </Card>
    </div>
  );
}