'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { Card, Avatar, Descriptions, Tag, Button, Space, Breadcrumb, Row, Col } from 'antd'
import {
  UserOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  HomeOutlined,
  TeamOutlined,
  EyeOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  CalendarOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  BankOutlined,
  SafetyOutlined,
  HeartOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { formatDate, formatCurrency } from '@/lib/utils'
import {
  AvatarWithInitials,
  StatusBadge,
  RoleBadge,
  EnhancedCard,
  EnhancedButton,
  CustomSpinner,
} from '@/components/ui'
import { useLocale } from 'next-intl'

interface EmployeeViewPageProps {
  role: 'admin' | 'manager'
}

export function EmployeeViewPage({ role }: EmployeeViewPageProps) {
  const params = useParams()
  const locale = useLocale()
  const id = params.id as string

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => apiClient.getUser(parseInt(id)),
    enabled: !!id,
  })

  const basePath = role === 'admin' ? '/admin' : '/manager'
  const listPath = `/${locale}${basePath}/employees`
  const editPath = `/${locale}${basePath}/employees/${id}/edit`
  const dashboardPath = `/${locale}${basePath}/dashboard`

  // Navigate with locale support
  const handleNavigation = (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <CustomSpinner size="large" text="Loading employee details..." />
      </div>
    )
  }

  if (!user || !user.data) {
    return <div className="text-center text-gray-500">Employee not found</div>
  }

  const userData = user.data

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          {
            title: (
              <Space>
                <HomeOutlined />
                <span>Dashboard</span>
              </Space>
            ),
            href: dashboardPath,
          },
          {
            title: (
              <Space>
                <TeamOutlined />
                <span>{role === 'admin' ? 'Employees' : 'My Team'}</span>
              </Space>
            ),
            href: listPath,
          },
          {
            title: (
              <Space>
                <EyeOutlined />
                <span>Employee Details</span>
              </Space>
            ),
          },
        ]}
      />

      {/* Header Card */}
      <EnhancedCard className="mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <AvatarWithInitials name={userData.fullName} size="xl" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {userData.fullName}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <IdcardOutlined />
                  <span className="font-mono text-sm bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg">
                    {userData.employeeCode}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <UserOutlined />
                  <span>{userData.jobTitle || 'No Job Title'}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <RoleBadge role={userData.role} size="default" />
                <StatusBadge status={userData.active ? 'active' : 'inactive'} size="default" />
                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                  <MailOutlined />
                  <span>{userData.email}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <EnhancedButton
              variant="ghost"
              icon={<ArrowLeftOutlined />}
              onClick={() => handleNavigation(listPath)}
            >
              Back
            </EnhancedButton>
            <EnhancedButton
              variant="primary"
              icon={<EditOutlined />}
              onClick={() => handleNavigation(editPath)}
            >
              Edit
            </EnhancedButton>
          </div>
        </div>
      </EnhancedCard>

      {/* Employee Details */}
      <Row gutter={[24, 24]}>
        {/* Basic Information */}
        <Col xs={24} lg={12}>
          <EnhancedCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <UserOutlined className="text-white text-lg" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Basic Information
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <UserOutlined className="text-blue-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Full Name</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{userData.fullName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <IdcardOutlined className="text-green-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Username</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{userData.username}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <MailOutlined className="text-purple-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{userData.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <PhoneOutlined className="text-orange-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Phone</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {userData.phone || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>
          </EnhancedCard>
        </Col>

        {/* Employment Details */}
        <Col xs={24} lg={12}>
          <EnhancedCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                <BankOutlined className="text-white text-lg" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Employment Details
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <BankOutlined className="text-blue-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Department</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {userData.department?.departmentName || 'Not assigned'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <DollarOutlined className="text-green-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Base Salary</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {userData.baseSalary ? formatCurrency(userData.baseSalary) : 'Not specified'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <CalendarOutlined className="text-purple-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Start Date</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {userData.startDate ? formatDate(userData.startDate) : 'Not specified'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <ClockCircleOutlined className="text-orange-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Probation End</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {userData.probationEnd ? formatDate(userData.probationEnd) : 'Not specified'}
                  </p>
                </div>
              </div>
            </div>
          </EnhancedCard>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Contact Information */}
        <Col xs={24} lg={12}>
          <EnhancedCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <EnvironmentOutlined className="text-white text-lg" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Contact Information
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <EnvironmentOutlined className="text-red-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Address</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {userData.address || 'Not provided'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <EnvironmentOutlined className="text-orange-500 mt-1 text-xs" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">City</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {userData.city || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <EnvironmentOutlined className="text-blue-500 mt-1 text-xs" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Country</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {userData.country || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </EnhancedCard>
        </Col>

        {/* Personal Information */}
        <Col xs={24} lg={12}>
          <EnhancedCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <HeartOutlined className="text-white text-lg" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Personal Information
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <CalendarOutlined className="text-pink-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Date of Birth</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {userData.dateOfBirth ? formatDate(userData.dateOfBirth) : 'Not provided'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <SafetyOutlined className="text-red-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Emergency Contact</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {userData.emergencyContact || 'Not provided'}
                  </p>
                  {userData.emergencyPhone && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
                      <PhoneOutlined className="text-xs" />
                      {userData.emergencyPhone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </EnhancedCard>
        </Col>
      </Row>

      {/* Professional Information */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <EnhancedCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
                <TrophyOutlined className="text-white text-lg" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Professional Information
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <TrophyOutlined className="text-indigo-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Skills & Competencies</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {userData.skills || 'Not specified'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <BankOutlined className="text-blue-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Professional Experience</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {userData.experience || 'Not specified'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <CalendarOutlined className="text-green-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Account Created</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {userData.createdAt ? formatDate(userData.createdAt) : 'Not available'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <ClockCircleOutlined className="text-purple-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Login</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {userData.lastLogin ? formatDate(userData.lastLogin) : 'Never logged in'}
                  </p>
                </div>
              </div>
            </div>
          </EnhancedCard>
        </Col>

        {/* Last Update Information */}
        <Col xs={24} lg={12}>
          <EnhancedCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-700 rounded-lg flex items-center justify-center">
                <ClockCircleOutlined className="text-white text-lg" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Last Update Information
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <CalendarOutlined className="text-gray-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Updated At</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {userData.updatedAt ? formatDate(userData.updatedAt) : 'Not available'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <UserOutlined className="text-gray-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Updated By</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {userData.updatedByName || 'System'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Profile Status
                  </p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${userData.active ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {userData.active ? 'Active Profile' : 'Inactive Profile'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </EnhancedCard>
        </Col>
      </Row>
    </div>
  )
}
