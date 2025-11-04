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
  Alert,
  Typography,
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
  FlagOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { AvatarWithInitials } from '@/components/ui'
import dayjs from 'dayjs'

const { Title } = Typography

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
              <span className="flex items-center cursor-pointer hover:text-blue-600 transition-colors" onClick={() => router.push(dashboardPath)}>
                <HomeOutlined className="mr-1" />
                Dashboard
              </span>
            ),
          },
          {
            title: (
              <span className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => router.push(listPath)}>
                <FileTextOutlined className="mr-1" />
                Applications
              </span>
            ),
          },
          {
            title: (
              <span className="flex items-center">
                <InfoCircleOutlined className="mr-1" />
                View Details
              </span>
            ),
          },
        ]}
      />

      {/* Header */}
      <Card className="shadow-lg border-t-4 border-t-purple-500">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileTextOutlined className="text-white text-2xl" />
            </div>
            <div>
              <Title level={2} className="!mb-1 !text-gray-900 dark:!text-gray-100">
                Application Details
              </Title>
              <p className="text-gray-500 dark:text-gray-400 m-0">
                View complete application information and approval history
              </p>
            </div>
          </div>
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => router.push(listPath)}
              size="large"
            >
              Back to List
            </Button>
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              onClick={() => router.push(editPath)}
              size="large"
              className="bg-gradient-to-r from-purple-500 to-indigo-600 border-none hover:from-purple-600 hover:to-indigo-700"
            >
              Edit Application
            </Button>
          </Space>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        {/* Main Details */}
        <Col xs={24} lg={16}>
          <Card 
            title={
              <span className="flex items-center gap-2 text-lg">
                <FileTextOutlined className="text-purple-500" />
                Application Information
              </span>
            }
            className="mb-4 shadow-md"
          >
            <Descriptions bordered column={1} size="middle">
              <Descriptions.Item 
                label={<span className="font-semibold">Title</span>}
                labelStyle={{ width: '30%', backgroundColor: '#fafafa' }}
              >
                <span className="text-gray-700 dark:text-gray-300">{application.title}</span>
              </Descriptions.Item>
              <Descriptions.Item 
                label={<span className="font-semibold">Type</span>}
                labelStyle={{ width: '30%', backgroundColor: '#fafafa' }}
              >
                <Tag color="blue" className="font-medium">{application.applicationType.toUpperCase()}</Tag>
              </Descriptions.Item>
              <Descriptions.Item 
                label={<span className="font-semibold">Priority</span>}
                labelStyle={{ width: '30%', backgroundColor: '#fafafa' }}
              >
                {getPriorityTag(application.priority)}
              </Descriptions.Item>
              <Descriptions.Item 
                label={<span className="font-semibold">Status</span>}
                labelStyle={{ width: '30%', backgroundColor: '#fafafa' }}
              >
                {getStatusTag(application.status)}
              </Descriptions.Item>
              <Descriptions.Item 
                label={<span className="font-semibold">Start Date</span>}
                labelStyle={{ width: '30%', backgroundColor: '#fafafa' }}
              >
                <CalendarOutlined className="mr-2 text-blue-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  {dayjs(application.startDate).format('MMM DD, YYYY')}
                </span>
              </Descriptions.Item>
              <Descriptions.Item 
                label={<span className="font-semibold">End Date</span>}
                labelStyle={{ width: '30%', backgroundColor: '#fafafa' }}
              >
                <CalendarOutlined className="mr-2 text-blue-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  {dayjs(application.endDate).format('MMM DD, YYYY')}
                </span>
              </Descriptions.Item>
              <Descriptions.Item 
                label={<span className="font-semibold">Duration</span>}
                labelStyle={{ width: '30%', backgroundColor: '#fafafa' }}
              >
                <Tag color="purple" className="font-medium">
                  {dayjs(application.endDate).diff(dayjs(application.startDate), 'days') + 1} day(s)
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item 
                label={<span className="font-semibold">Reason</span>}
                labelStyle={{ width: '30%', backgroundColor: '#fafafa' }}
              >
                <span className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {application.reason || 'N/A'}
                </span>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Applicant Information */}
          <Card 
            title={
              <span className="flex items-center gap-2 text-lg">
                <UserOutlined className="text-purple-500" />
                Applicant Information
              </span>
            }
            className="shadow-md"
          >
            <div className="flex items-center gap-4 mb-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg">
              <AvatarWithInitials name={application.userName || 'N/A'} size="xl" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 m-0">
                  {application.userName || 'N/A'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 m-0">
                  {application.userEmail || 'N/A'}
                </p>
              </div>
            </div>
            <Descriptions bordered column={1} size="middle">
              <Descriptions.Item 
                label={<span className="font-semibold">Department</span>}
                labelStyle={{ width: '30%', backgroundColor: '#fafafa' }}
              >
                <span className="text-gray-700 dark:text-gray-300">
                  {application.departmentName || 'N/A'}
                </span>
              </Descriptions.Item>
              <Descriptions.Item 
                label={<span className="font-semibold">Submitted On</span>}
                labelStyle={{ width: '30%', backgroundColor: '#fafafa' }}
              >
                <CalendarOutlined className="mr-2 text-blue-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  {dayjs(application.createdAt).format('MMM DD, YYYY hh:mm A')}
                </span>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Rejection Details */}
          {application.status === 'rejected' && application.rejectionReason && (
            <Card 
              title={
                <span className="flex items-center gap-2 text-lg">
                  <CloseCircleOutlined className="text-red-500" />
                  Rejection Details
                </span>
              }
              className="mt-4 shadow-md"
            >
              <Alert
                message="Application Rejected"
                description={
                  <div className="space-y-2">
                    <p className="mb-2">
                      <strong>Rejected by:</strong> 
                      <span className="ml-2 text-gray-700">{application.rejectedByName}</span>
                    </p>
                    <p className="mb-2">
                      <strong>Rejected on:</strong> 
                      <span className="ml-2 text-gray-700">
                        {dayjs(application.rejectedAt).format('MMM DD, YYYY hh:mm A')}
                      </span>
                    </p>
                    <p>
                      <strong>Reason:</strong> 
                      <span className="ml-2 text-gray-700 block mt-1 whitespace-pre-wrap">
                        {application.rejectionReason}
                      </span>
                    </p>
                  </div>
                }
                type="error"
                showIcon
                className="shadow-sm"
              />
            </Card>
          )}

          {/* Approval Details */}
          {application.status === 'approved' && application.approvedByName && (
            <Card 
              title={
                <span className="flex items-center gap-2 text-lg">
                  <CheckCircleOutlined className="text-green-500" />
                  Approval Details
                </span>
              }
              className="mt-4 shadow-md"
            >
              <Alert
                message="Application Approved"
                description={
                  <div className="space-y-2">
                    <p className="mb-2">
                      <strong>Approved by:</strong> 
                      <span className="ml-2 text-gray-700">{application.approvedByName}</span>
                    </p>
                    <p>
                      <strong>Approved on:</strong> 
                      <span className="ml-2 text-gray-700">
                        {dayjs(application.approvedAt).format('MMM DD, YYYY hh:mm A')}
                      </span>
                    </p>
                  </div>
                }
                type="success"
                showIcon
                className="shadow-sm"
              />
            </Card>
          )}
        </Col>

        {/* Timeline */}
        <Col xs={24} lg={8}>
          <Card 
            title={
              <span className="flex items-center gap-2 text-lg">
                <ClockCircleOutlined className="text-purple-500" />
                Application Timeline
              </span>
            }
            className="shadow-md"
          >
            <Timeline items={timelineItems} mode="left" />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
