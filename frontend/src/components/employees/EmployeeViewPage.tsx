'use client'

import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { Card, Spin, Avatar, Descriptions, Tag, Button, Space, Breadcrumb, Row, Col } from 'antd'
import { UserOutlined, EditOutlined, ArrowLeftOutlined, HomeOutlined, TeamOutlined, EyeOutlined } from '@ant-design/icons'
import { formatDate, formatCurrency } from '@/lib/utils'

interface EmployeeViewPageProps {
  role: 'admin' | 'manager'
}

export function EmployeeViewPage({ role }: EmployeeViewPageProps) {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => apiClient.getUser(parseInt(id)),
    enabled: !!id,
  })

  const basePath = role === 'admin' ? '/admin' : '/manager'
  const listPath = `${basePath}/employees`
  const editPath = `${basePath}/employees/${id}/edit`
  const dashboardPath = `${basePath}/dashboard`

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar
            size={64}
            icon={<UserOutlined />}
            className="bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300"
          >
            {userData.fullName?.charAt(0)}
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {userData.fullName}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {userData.jobTitle || 'No Job Title'} • {userData.employeeCode}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <Tag color={userData.role === 'ROLE_ADMIN' ? 'red' : userData.role === 'ROLE_MANAGER' ? 'blue' : 'green'}>
                {userData.role?.replace('ROLE_', '')}
              </Tag>
              <Tag color={userData.active ? 'green' : 'red'}>
                {userData.active ? 'Active' : 'Inactive'}
              </Tag>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push(listPath)}
          >
            Back to {role === 'admin' ? 'List' : 'Team'}
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => router.push(editPath)}
          >
            Edit Employee
          </Button>
        </div>
      </div>

      {/* Employee Details */}
      <Row gutter={[24, 16]}>
        {/* Basic Information */}
        <Col xs={24} lg={12}>
          <Card title="Basic Information" className="dark:bg-gray-800 dark:border-gray-700">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Full Name" span={2}>{userData.fullName}</Descriptions.Item>
              <Descriptions.Item label="Username">{userData.username}</Descriptions.Item>
              <Descriptions.Item label="Employee Code">{userData.employeeCode}</Descriptions.Item>
              <Descriptions.Item label="Email" span={2}>{userData.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{userData.phone || 'Not provided'}</Descriptions.Item>
              <Descriptions.Item label="Role">
                <Tag color={userData.role === 'ROLE_ADMIN' ? 'red' : userData.role === 'ROLE_MANAGER' ? 'blue' : 'green'}>
                  {userData.role?.replace('ROLE_', '')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={userData.active ? 'green' : 'red'}>
                  {userData.active ? 'Active' : 'Inactive'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Employment Details */}
        <Col xs={24} lg={12}>
          <Card title="Employment Details" className="dark:bg-gray-800 dark:border-gray-700">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Job Title">{userData.jobTitle || 'Not assigned'}</Descriptions.Item>
              <Descriptions.Item label="Department">{userData.department?.departmentName || 'Not assigned'}</Descriptions.Item>
              <Descriptions.Item label="Employment Type">{userData.employmentType || 'Full-time'}</Descriptions.Item>
              <Descriptions.Item label="Work Location">{userData.workLocation || 'Office'}</Descriptions.Item>
              <Descriptions.Item label="Base Salary">
                {userData.baseSalary ? formatCurrency(userData.baseSalary) : 'Not specified'}
              </Descriptions.Item>
              <Descriptions.Item label="Start Date">
                {userData.startDate ? formatDate(userData.startDate) : 'Not specified'}
              </Descriptions.Item>
              <Descriptions.Item label="End Date">
                {userData.endDate ? formatDate(userData.endDate) : 'Ongoing'}
              </Descriptions.Item>
              <Descriptions.Item label="Probation End">
                {userData.probationEnd ? formatDate(userData.probationEnd) : 'Not specified'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 16]}>
        {/* Contact Information */}
        <Col xs={24} lg={12}>
          <Card title="Contact Information" className="dark:bg-gray-800 dark:border-gray-700">
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Address">
                {userData.address || 'Not provided'}
              </Descriptions.Item>
              <Descriptions.Item label="City">
                {userData.city || 'Not provided'}
              </Descriptions.Item>
              <Descriptions.Item label="Country">
                {userData.country || 'Not provided'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Personal Information */}
        <Col xs={24} lg={12}>
          <Card title="Personal Information" className="dark:bg-gray-800 dark:border-gray-700">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Date of Birth">
                {userData.dateOfBirth ? formatDate(userData.dateOfBirth) : 'Not provided'}
              </Descriptions.Item>
              <Descriptions.Item label="Gender">{userData.gender || 'Not specified'}</Descriptions.Item>
              <Descriptions.Item label="Marital Status">
                {userData.maritalStatus || 'Not specified'}
              </Descriptions.Item>
              <Descriptions.Item label="Emergency Contact">
                {userData.emergencyContact || 'Not provided'}
              </Descriptions.Item>
              <Descriptions.Item label="Emergency Phone" span={2}>
                {userData.emergencyPhone || 'Not provided'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* Professional Information */}
      <Row gutter={[24, 16]}>
        <Col xs={24}>
          <Card title="Professional Information" className="dark:bg-gray-800 dark:border-gray-700">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Skills & Competencies" span={2}>
                {userData.skills || 'Not specified'}
              </Descriptions.Item>
              <Descriptions.Item label="Professional Experience" span={2}>
                {userData.experience || 'Not specified'}
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {userData.createdAt ? formatDate(userData.createdAt) : 'Not available'}
              </Descriptions.Item>
              <Descriptions.Item label="Last Login">
                {userData.lastLogin ? formatDate(userData.lastLogin) : 'Never logged in'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* Last Update Information */}
      <Row gutter={[24, 16]}>
        <Col xs={24}>
          <Card title="Last Update Information" className="dark:bg-gray-800 dark:border-gray-700">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Last Updated At">
                {userData.updatedAt ? formatDate(userData.updatedAt) : 'Not available'}
              </Descriptions.Item>
              <Descriptions.Item label="Updated By">
                {userData.updatedByName || 'System'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
