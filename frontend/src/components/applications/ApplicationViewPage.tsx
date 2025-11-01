'use client'

import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { 
  Card, 
  Spin, 
  Descriptions, 
  Tag, 
  Button, 
  Space, 
  Breadcrumb,
  Row,
  Col,
  Timeline,
  Divider,
  Alert
} from 'antd'
import { 
  EditOutlined, 
  ArrowLeftOutlined, 
  HomeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
  FlagOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

interface ApplicationViewPageProps {
  role: 'admin' | 'manager'
}

export function ApplicationViewPage({ role }: ApplicationViewPageProps) {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const { data: applicationData, isLoading } = useQuery({
    queryKey: ['application', id],
    queryFn: () => apiClient.getApplication(id),
    enabled: !!id,
  })

  const basePath = role === 'admin' ? '/admin' : '/manager'
  const listPath = `${basePath}/applications`
  const editPath = `${basePath}/applications/${id}/edit`
  const dashboardPath = `${basePath}/dashboard`

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    )
  }

  if (!applicationData) {
    return <div className="text-center text-gray-500">Application not found</div>
  }

  const application: any = applicationData

  // Status tag configuration
  const getStatusTag = (status: string) => {
    const statusConfig = {
      pending: { color: 'gold', icon: <ClockCircleOutlined />, text: 'Pending' },
      approved: { color: 'green', icon: <CheckCircleOutlined />, text: 'Approved' },
      rejected: { color: 'red', icon: <CloseCircleOutlined />, text: 'Rejected' },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    )
  }

  // Priority tag configuration
  const getPriorityTag = (priority: string) => {
    const priorityConfig = {
      low: { color: 'default', text: 'Low' },
      medium: { color: 'processing', text: 'Medium' },
      high: { color: 'warning', text: 'High' },
      urgent: { color: 'error', text: 'Urgent' },
    }
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low
    return (
      <Tag color={config.color} icon={<FlagOutlined />}>
        {config.text}
      </Tag>
    )
  }

  // Build timeline for status changes
  const timelineItems = []
  
  // Created
  timelineItems.push({
    color: 'blue',
    dot: <UserOutlined />,
    children: (
      <div>
        <p className="font-semibold">Application Created</p>
        <p className="text-sm text-gray-500">
          By: {application.userName || 'N/A'}
        </p>
        <p className="text-sm text-gray-500">
          {dayjs(application.createdAt).format('MMM DD, YYYY hh:mm A')}
        </p>
      </div>
    ),
  })

  // Approved
  if (application.approvedAt && application.approvedByName) {
    timelineItems.push({
      color: 'green',
      dot: <CheckCircleOutlined />,
      children: (
        <div>
          <p className="font-semibold">Application Approved</p>
          <p className="text-sm text-gray-500">
            By: {application.approvedByName}
          </p>
          <p className="text-sm text-gray-500">
            {dayjs(application.approvedAt).format('MMM DD, YYYY hh:mm A')}
          </p>
        </div>
      ),
    })
  }

  // Rejected
  if (application.rejectedAt && application.rejectedByName) {
    timelineItems.push({
      color: 'red',
      dot: <CloseCircleOutlined />,
      children: (
        <div>
          <p className="font-semibold">Application Rejected</p>
          <p className="text-sm text-gray-500">
            By: {application.rejectedByName}
          </p>
          <p className="text-sm text-gray-500">
            {dayjs(application.rejectedAt).format('MMM DD, YYYY hh:mm A')}
          </p>
          {application.rejectionReason && (
            <p className="text-sm text-gray-500 mt-1">
              Reason: {application.rejectionReason}
            </p>
          )}
        </div>
      ),
    })
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          {
            title: (
              <span className="flex items-center cursor-pointer" onClick={() => router.push(dashboardPath)}>
                <HomeOutlined className="mr-1" />
                Dashboard
              </span>
            ),
          },
          {
            title: (
              <span className="cursor-pointer" onClick={() => router.push(listPath)}>
                Applications
              </span>
            ),
          },
          {
            title: 'View Details',
          },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Application Details
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View complete application information and approval history
          </p>
        </div>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push(listPath)}>
            Back to List
          </Button>
          <Button type="primary" icon={<EditOutlined />} onClick={() => router.push(editPath)}>
            Edit Application
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {/* Main Details */}
        <Col xs={24} lg={16}>
          <Card title="Application Information" className="mb-4">
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Title">
                {application.title}
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color="blue">{application.applicationType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                {getPriorityTag(application.priority)}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {getStatusTag(application.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Start Date">
                <CalendarOutlined className="mr-2" />
                {dayjs(application.startDate).format('MMM DD, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="End Date">
                <CalendarOutlined className="mr-2" />
                {dayjs(application.endDate).format('MMM DD, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Duration">
                {dayjs(application.endDate).diff(dayjs(application.startDate), 'days') + 1} day(s)
              </Descriptions.Item>
              <Descriptions.Item label="Reason">
                {application.reason || 'N/A'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Applicant Information */}
          <Card title="Applicant Information">
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Name">
                <UserOutlined className="mr-2" />
                {application.userName || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {application.userEmail || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                {application.departmentName || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Submitted On">
                <CalendarOutlined className="mr-2" />
                {dayjs(application.createdAt).format('MMM DD, YYYY hh:mm A')}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Rejection Details */}
          {application.status === 'rejected' && application.rejectionReason && (
            <Card title="Rejection Details" className="mt-4">
              <Alert
                message="Application Rejected"
                description={
                  <div>
                    <p className="mb-2"><strong>Rejected by:</strong> {application.rejectedByName}</p>
                    <p className="mb-2"><strong>Rejected on:</strong> {dayjs(application.rejectedAt).format('MMM DD, YYYY hh:mm A')}</p>
                    <p><strong>Reason:</strong> {application.rejectionReason}</p>
                  </div>
                }
                type="error"
                showIcon
              />
            </Card>
          )}

          {/* Approval Details */}
          {application.status === 'approved' && application.approvedByName && (
            <Card title="Approval Details" className="mt-4">
              <Alert
                message="Application Approved"
                description={
                  <div>
                    <p className="mb-2"><strong>Approved by:</strong> {application.approvedByName}</p>
                    <p><strong>Approved on:</strong> {dayjs(application.approvedAt).format('MMM DD, YYYY hh:mm A')}</p>
                  </div>
                }
                type="success"
                showIcon
              />
            </Card>
          )}
        </Col>

        {/* Timeline */}
        <Col xs={24} lg={8}>
          <Card title="Application Timeline">
            <Timeline items={timelineItems} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
