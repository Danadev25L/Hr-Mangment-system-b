'use client';

import React, { useEffect } from 'react';
import { Form, Input, Button, Card, Alert, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useLogin } from '@/src/hooks/useLogin';
import { useAuthStore } from '@/src/store/useAuthStore';

const { Title, Text } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const loginMutation = useLogin();
  const [form] = Form.useForm();

  // Clear any existing auth on mount and redirect if already authenticated
  useEffect(() => {
    console.log('🔐 Login Page - isAuthenticated:', isAuthenticated, 'user:', user);
    
    if (isAuthenticated && user) {
      console.log('✅ User already authenticated, redirecting to dashboard');
      const rolePath = user.role === 'admin' ? 'admin' : user.role === 'manager' ? 'manager' : 'employee';
      router.replace(`/dashboard/${rolePath}`);
    } else {
      // Clear any stale auth data when landing on login page
      console.log('🧹 Clearing any stale auth data');
      logout();
    }
  }, [isAuthenticated, user, logout, router]);

  const handleSubmit = async (values: { username: string; password: string }) => {
    console.log('📝 Submitting login form with username:', values.username);
    loginMutation.mutate(values);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-5">
      <Card className="w-full max-w-md shadow-2xl rounded-xl">
        <Space direction="vertical" size="large" className="w-full">
          {/* Logo and Title */}
          <div className="text-center">
            <Title level={2} className="mb-2" style={{ color: '#667eea' }}>
              HR System
            </Title>
            <Text type="secondary">Login to your account</Text>
          </div>

          {/* Error Alert */}
          {loginMutation.isError && (
            <Alert
              message="Login Failed"
              description={loginMutation.error?.message || 'Invalid username or password'}
              type="error"
              showIcon
              closable
            />
          )}

          {/* Login Form */}
          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
            autoComplete="off"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: 'Please enter your username' },
                { min: 3, message: 'Username must be at least 3 characters' },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                placeholder="Username"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Please enter your password' },
                { min: 6, message: 'Password must be at least 6 characters' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                placeholder="Password"
                autoComplete="current-password"
                iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>

            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loginMutation.isPending}
                className="h-11 text-base"
              >
                {loginMutation.isPending ? 'Logging in...' : 'Login'}
              </Button>
            </Form.Item>
          </Form>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <Text type="secondary" className="text-xs">
              © 2025 HR System by Dana. All rights reserved.
            </Text>
          </div>

          {/* Development Help */}
          {process.env.NODE_ENV === 'development' && (
            <Alert
              message="Development Mode"
              description={
                <div className="space-y-1">
                  <p><strong>Test Credentials:</strong></p>
                  <p>Contact your administrator for login credentials</p>
                  <p className="text-xs mt-2">
                    Backend API: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}
                  </p>
                  <p className="text-xs">
                    <a href="/clear-auth" className="text-blue-500 underline">Clear Auth Data</a>
                  </p>
                </div>
              }
              type="info"
              showIcon
            />
          )}
        </Space>
      </Card>
    </div>
  );
}
