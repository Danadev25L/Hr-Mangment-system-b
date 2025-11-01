'use client'

import React, { useState } from 'react'
import { Form, Input, Button, Checkbox, Divider, message } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface LoginFormData {
  username: string
  password: string
  remember: boolean
}

export const LoginForm: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { login, error, isLoading } = useAuth()
  const router = useRouter()

  const handleSubmit = async (values: LoginFormData) => {
    try {
      setLoading(true)
      await login(values.username, values.password)
      message.success('Login successful!')

      // Redirect based on user role from authenticated context
      setTimeout(() => {
        const role = localStorage.getItem('userRole') || 'employee'
        switch (role) {
          case 'ROLE_ADMIN':
            router.push('/admin/dashboard')
            break
          case 'ROLE_MANAGER':
            router.push('/manager/dashboard')
            break
          case 'ROLE_EMPLOYEE':
            router.push('/employee/dashboard')
            break
          default:
            router.push('/employee/dashboard')
        }
      }, 100)
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <UserOutlined className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
              create a new account
            </Link>
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            layout="vertical"
            requiredMark={false}
            size="large"
          >
            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: 'Please input your username!' }]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="Enter your username"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item>
              <div className="flex items-center justify-between">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>Remember me</Checkbox>
                </Form.Item>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading || isLoading}
                block
                className="h-12 text-base font-medium"
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <Divider>or continue with</Divider>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              block
              className="h-10"
              onClick={() => message.info('Google login coming soon!')}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
            <Button
              variant="outline"
              block
              className="h-10"
              onClick={() => message.info('Microsoft login coming soon!')}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#f25022" d="M11.4 11.4H2.6V2.6h8.8v8.8z" />
                <path fill="#00a4ef" d="M21.4 11.4h-8.8V2.6h8.8v8.8z" />
                <path fill="#7fba00" d="M11.4 21.4H2.6v-8.8h8.8v8.8z" />
                <path fill="#ffb900" d="M21.4 21.4h-8.8v-8.8h8.8v8.8z" />
              </svg>
              Microsoft
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}