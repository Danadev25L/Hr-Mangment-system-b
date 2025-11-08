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
  Row,
  Col,
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
  NotificationOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { EnhancedCard, EnhancedButton, AvatarWithInitials, StatusBadge } from '@/components/ui'
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
  const { data: announcement, isLoading } = useQuery<any>({
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
              <span className="flex items-center gap-2 cursor-pointer" onClick={() => router.push(dashboardPath)}>
                <HomeOutlined />
                <span>Dashboard</span>
              </span>
            ),
          },
          {
            title: (
              <span className="flex items-center gap-2 cursor-pointer" onClick={() => router.push(listPath)}>
                <NotificationOutlined />
                <span>Announcements</span>
              </span>
            ),
          },
          {
            title: 'View Details',
          },
        ]}
      />

      {/* Page Header */}
      <EnhancedCard>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              {announcementData.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <div className="flex items-center gap-2 text-lg text-gray-700 dark:text-gray-300">
                <CalendarOutlined className="text-blue-500" />
                <span className="font-medium">{dayjs(announcementData.date).format('MMMM DD, YYYY')}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {announcementData.isActive !== undefined && (
                <StatusBadge status={announcementData.isActive ? 'active' : 'inactive'} />
              )}
              {role === 'employee' && announcementData.isRead && (
                <Tag color="green" icon={<CheckCircleOutlined />} className="rounded-lg">
                  Read
                </Tag>
              )}
              {!announcementData.department && announcementData.departmentId === null && (
                <Tag color="blue" icon={<TeamOutlined />} className="rounded-lg">
                  Company-wide
                </Tag>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <EnhancedButton
              variant="ghost"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push(listPath)}
            >
              Back
            </EnhancedButton>
            {(role === 'admin' || role === 'manager') && (
              <>
                <EnhancedButton
                  variant="primary"
                  icon={<EditOutlined />}
                  onClick={() => router.push(`${listPath}/${id}/edit`)}
                >
                  Edit
                </EnhancedButton>
                <EnhancedButton
                  variant="danger"
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                  loading={deleteAnnouncementMutation.isPending}
                >
                  Delete
                </EnhancedButton>
              </>
            )}
          </div>
        </div>
      </EnhancedCard>

      {/* Announcement Details */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <EnhancedCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FileTextOutlined className="text-white text-lg" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Announcement Content</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <NotificationOutlined className="text-blue-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Title</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{announcementData.title}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <FileTextOutlined className="text-purple-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Description</p>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{announcementData.description}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <CalendarOutlined className="text-green-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Announcement Date</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{dayjs(announcementData.date).format('MMMM DD, YYYY')}</p>
                </div>
              </div>
            </div>
          </EnhancedCard>
        </Col>

        <Col xs={24} lg={8}>
          <EnhancedCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                <InfoCircleOutlined className="text-white text-lg" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Details</h3>
            </div>
            <div className="space-y-4">
              {announcementData.department && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <BankOutlined className="text-orange-500 mt-1" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Department</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{announcementData.department.departmentName || 'N/A'}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <UserOutlined className="text-blue-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Created By</p>
                  <div className="flex items-center gap-2 mt-2">
                    <AvatarWithInitials name={announcementData.creator?.fullName || 'Unknown'} size="md" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">{announcementData.creator?.fullName || 'Unknown'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <CalendarOutlined className="text-indigo-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Created At</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{dayjs(announcementData.createdAt).format('MMMM DD, YYYY HH:mm')}</p>
                </div>
              </div>
            </div>
          </EnhancedCard>
        </Col>
      </Row>

      {/* Recipients (admin and manager only) */}
      {(role === 'admin' || role === 'manager') && announcement.recipients && announcement.recipients.length > 0 && (
        <EnhancedCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center">
              <TeamOutlined className="text-white text-lg" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recipients ({announcement.recipients.length})</h3>
          </div>
          <div className="space-y-3">
            {announcement.recipients.map((recipient: any) => (
              <div key={recipient.userId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <AvatarWithInitials name={recipient.user?.fullName || 'Unknown'} size="md" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{recipient.user?.fullName || 'Unknown'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{recipient.user?.role || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  {recipient.isRead ? (
                    <Tag color="green" icon={<CheckCircleOutlined />} className="rounded-lg">
                      Read at {dayjs(recipient.readAt).format('MMM DD, HH:mm')}
                    </Tag>
                  ) : (
                    <Tag color="orange" className="rounded-lg">Unread</Tag>
                  )}
                </div>
              </div>
            ))}
          </div>
        </EnhancedCard>
      )}
    </div>
  )
}
