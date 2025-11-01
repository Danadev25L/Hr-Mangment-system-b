'use client'

import React from 'react'
import {
  Card,
  Button,
  Space,
  Tag,
  Breadcrumb,
  Descriptions,
  message,
  Spin,
  Empty,
  Typography,
  Divider,
} from 'antd'
import {
  ArrowLeftOutlined,
  HomeOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  UserOutlined,
  BankOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'

const { Title, Paragraph, Text } = Typography

interface AnnouncementViewPageProps {
  role: 'admin' | 'manager' | 'employee'
  id: string
}

export function AnnouncementViewPage({ role, id }: AnnouncementViewPageProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const basePath = role === 'admin' ? '/admin' : role === 'manager' ? '/manager' : '/employee'
  const listPath = `${basePath}/announcements`
  const dashboardPath = `${basePath}/dashboard`

  // Fetch announcement details
  const { data: announcement, isLoading } = useQuery({
    queryKey: ['announcement', id],
    queryFn: () => apiClient.getAnnouncement(parseInt(id)),
  })

  // Mark as read (employee only)
  const markAsReadMutation = useMutation({
    mutationFn: (announcementId: number) => apiClient.markAnnouncementAsRead(announcementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcement', id] })
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
  })

  // Mark as read when employee views
  React.useEffect(() => {
    if (role === 'employee' && announcement && !announcement.isRead) {
      markAsReadMutation.mutate(parseInt(id))
    }
  }, [role, announcement])

  // Delete mutation
  const deleteAnnouncementMutation = useMutation({
    mutationFn: (announcementId: number) => apiClient.deleteAnnouncement(announcementId),
    onSuccess: () => {
      message.success('Announcement deleted successfully')
      router.push(listPath)
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to delete announcement')
    },
  })

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      deleteAnnouncementMutation.mutate(parseInt(id))
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    )
  }

  if (!announcement) {
    return (
      <Card>
        <Empty description="Announcement not found" />
        <div className="text-center mt-4">
          <Button onClick={() => router.push(listPath)}>
            Back to Announcements
          </Button>
        </div>
      </Card>
    )
  }

  const announcementData = announcement.announcement || announcement

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
                Announcements
              </span>
            ),
          },
          {
            title: 'View Details',
          },
        ]}
      />

      {/* Page Header */}
      <Card>
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-3">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push(listPath)}
            />
            <div>
              <div className="flex items-center space-x-3">
                <Title level={2} className="m-0">
                  {announcementData.title}
                </Title>
                {announcementData.isActive !== undefined && (
                  <Tag color={announcementData.isActive ? 'green' : 'red'}>
                    {announcementData.isActive ? 'Active' : 'Inactive'}
                  </Tag>
                )}
                {role === 'employee' && announcementData.isRead && (
                  <Tag color="green" icon={<CheckCircleOutlined />}>
                    Read
                  </Tag>
                )}
              </div>
              <Text type="secondary">
                <CalendarOutlined className="mr-2" />
                {dayjs(announcementData.date).format('MMMM DD, YYYY')}
              </Text>
            </div>
          </div>

          {(role === 'admin' || role === 'manager') && (
            <Space>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => router.push(`${listPath}/${id}/edit`)}
              >
                Edit
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleDelete}
                loading={deleteAnnouncementMutation.isPending}
              >
                Delete
              </Button>
            </Space>
          )}
        </div>
      </Card>

      {/* Announcement Details */}
      <Card title="Announcement Details">
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Title">
            {announcementData.title}
          </Descriptions.Item>

          <Descriptions.Item label="Description">
            <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
              {announcementData.description}
            </Paragraph>
          </Descriptions.Item>

          <Descriptions.Item label="Date">
            {dayjs(announcementData.date).format('MMMM DD, YYYY')}
          </Descriptions.Item>

          {announcementData.department && (
            <Descriptions.Item label="Department">
              <BankOutlined className="mr-2" />
              {announcementData.department.departmentName || 'N/A'}
            </Descriptions.Item>
          )}

          {!announcementData.department && announcementData.departmentId === null && (
            <Descriptions.Item label="Scope">
              <Tag color="blue">Company-wide</Tag>
            </Descriptions.Item>
          )}

          <Descriptions.Item label="Created By">
            <UserOutlined className="mr-2" />
            {announcementData.creator?.fullName || 'Unknown'}
          </Descriptions.Item>

          {announcementData.isActive !== undefined && (
            <Descriptions.Item label="Status">
              <Tag color={announcementData.isActive ? 'green' : 'red'}>
                {announcementData.isActive ? 'Active' : 'Inactive'}
              </Tag>
            </Descriptions.Item>
          )}

          <Descriptions.Item label="Created At">
            {dayjs(announcementData.createdAt).format('MMMM DD, YYYY HH:mm')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Recipients (admin and manager only) */}
      {(role === 'admin' || role === 'manager') && announcement.recipients && announcement.recipients.length > 0 && (
        <Card title="Recipients">
          <div className="space-y-2">
            {announcement.recipients.map((recipient: any) => (
              <div key={recipient.userId} className="flex justify-between items-center p-2 border-b">
                <div>
                  <UserOutlined className="mr-2" />
                  <Text strong>{recipient.user?.fullName || 'Unknown'}</Text>
                  <Text type="secondary" className="ml-2">
                    ({recipient.user?.role || 'N/A'})
                  </Text>
                </div>
                <div>
                  {recipient.isRead ? (
                    <Tag color="green" icon={<CheckCircleOutlined />}>
                      Read at {dayjs(recipient.readAt).format('MMM DD, YYYY HH:mm')}
                    </Tag>
                  ) : (
                    <Tag color="orange">Unread</Tag>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
