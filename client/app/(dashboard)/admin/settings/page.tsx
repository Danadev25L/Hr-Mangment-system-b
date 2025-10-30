'use client';

import { useAuthGuard } from '@/src/middleware/auth';
import { Card, Form, Input, Button, Switch, Space, message, Divider, Row, Col } from 'antd';
import { SettingOutlined } from '@ant-design/icons';

export default function AdminSettingsPage() {
  const { isAuthenticated, loading } = useAuthGuard('admin');
  const [form] = Form.useForm();

  const handleSubmit = (values: Record<string, unknown>) => {
    console.log('Settings updated:', values);
    message.success('Settings updated successfully');
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <SettingOutlined className="text-2xl" />
        <h1 className="text-2xl font-bold">System Settings</h1>
      </div>
      
      <Row gutter={16}>
        <Col span={12}>
          <Card title="Application Settings">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                companyName: 'Tech Solutions Inc.',
                emailNotifications: true,
                allowRegistration: false,
                autoApproval: false,
              }}
            >
              <Form.Item
                name="companyName"
                label="Company Name"
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="emailNotifications"
                label="Email Notifications"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="allowRegistration"
                label="Allow User Registration"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="autoApproval"
                label="Auto-approve Applications"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Button type="primary" htmlType="submit">
                Save Settings
              </Button>
            </Form>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="System Information">
            <div className="space-y-4">
              <div>
                <strong>System Version:</strong>
                <span className="ml-2">1.0.0</span>
              </div>
              <div>
                <strong>Last Updated:</strong>
                <span className="ml-2">{new Date().toLocaleDateString()}</span>
              </div>
              <div>
                <strong>Database Status:</strong>
                <span className="ml-2 text-green-600">Connected</span>
              </div>

              <Divider />

              <Space direction="vertical" className="w-full">
                <Button type="primary" block>
                  Export System Data
                </Button>
                <Button block>
                  Import Data
                </Button>
                <Button danger block>
                  Clear System Logs
                </Button>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}