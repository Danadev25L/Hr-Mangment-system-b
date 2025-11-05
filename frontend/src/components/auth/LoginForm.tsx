'use client'

import React, { useState } from 'react'
import { Form, Input, Button, message } from 'antd'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from 'next-intl'
import LocaleSwitcher from '@/components/LocaleSwitcher'
import { createLocalizedPath, getCurrentLocale } from '@/lib/localized-routes'
import horizontalLogo from '@/public/colored horizontal.png'

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
  const pathname = usePathname()
  const t = useTranslations()

  const locale = getCurrentLocale(pathname)

  const handleSubmit = async (values: LoginFormData) => {
    try {
      setLoading(true)
      const result = await login(values.username, values.password)
      message.success(t('auth.loginSuccess'))

      // Get role and redirect immediately - cookies are already set by apiClient
      const role = localStorage.getItem('userRole') || 'ROLE_EMPLOYEE'
      
      let dashboardPath = ''
      switch (role) {
        case 'ROLE_ADMIN':
          dashboardPath = createLocalizedPath(locale, '/admin/dashboard')
          break
        case 'ROLE_MANAGER':
          dashboardPath = createLocalizedPath(locale, '/manager/dashboard')
          break
        case 'ROLE_EMPLOYEE':
          dashboardPath = createLocalizedPath(locale, '/employee/dashboard')
          break
        default:
          dashboardPath = createLocalizedPath(locale, '/employee/dashboard')
      }
      
      // Use router.push for faster client-side navigation
      router.push(dashboardPath)
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-purple-100 to-indigo-100 dark:from-gray-900 dark:via-purple-900/10 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center items-center mb-6">
            <Image
              src={horizontalLogo}
              alt="HR Management System"
              width={200}
              height={64}
              className="h-16 w-auto object-contain"
              priority
            />
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
            {t('auth.signIn')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('auth.welcomeBack')}
          </p>
        </div>

        {/* Language Switcher */}
        <div className="flex justify-end">
          <LocaleSwitcher />
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
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
              label={<span className="text-gray-700 dark:text-gray-300 font-medium">{t('auth.username')}</span>}
              rules={[{ required: true, message: t('auth.usernameRequired') }]}
            >
              <Input
                prefix={
                  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
                placeholder={t('auth.enterUsername')}
                autoComplete="username"
                className="h-11 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span className="text-gray-700 dark:text-gray-300 font-medium">{t('auth.password')}</span>}
              rules={[{ required: true, message: t('auth.passwordRequired') }]}
            >
              <Input.Password
                prefix={
                  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
                placeholder={t('auth.enterPassword')}
                autoComplete="current-password"
                className="h-11 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </Form.Item>

            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading || isLoading}
                block
                className="h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading || isLoading ? t('auth.signingIn') : t('auth.signIn')}
              </Button>
            </Form.Item>
          </Form>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('auth.needHelp')}{' '}
              <Link
                href={createLocalizedPath(locale, '/support')}
                className="font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400"
              >
                {t('auth.contactSupport')}
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © 2025 HR Management System. {t('auth.allRightsReserved')}
          </p>
          <div className="flex justify-center gap-4 text-xs">
            <Link
              href={createLocalizedPath(locale, '/terms')}
              className="text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
            >
              {t('auth.terms')}
            </Link>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link
              href={createLocalizedPath(locale, '/privacy')}
              className="text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
            >
              {t('auth.privacy')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}