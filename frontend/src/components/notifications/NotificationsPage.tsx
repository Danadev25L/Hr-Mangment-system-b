'use client'

import React, { useState } from 'react'
import {
  Card,
  List,
  Badge,
  Button,
  Empty,
  Tag,
  Pagination,
  Space,
  Select,
  Input,
  Divider,
  message
} from 'antd'
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  ReloadOutlined,
  FilterOutlined,
  SearchOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useTranslations } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import { CustomSpinner } from '@/components/ui'

interface Notification {
  id: number
  userId: number
  title: string
  message: string
  type: string
  relatedId: number | null
  metadata: any
  isRead: boolean
  readAt: string | null
  createdAt: string
  updatedAt: string
}

export const NotificationsPage: React.FC = () => {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const t = useTranslations()
  const queryClient = useQueryClient()

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  // Fetch notifications
  const { data: notificationsData, isLoading, refetch } = useQuery({
    queryKey: ['notifications', 'all', page, pageSize, filterType, filterStatus, searchQuery],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/shared/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data.notifications || []
    },
    enabled: !!token
  })

  // Fetch unread count
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/shared/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    },
    enabled: !!token
  })

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/shared/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      message.success(t('notifications.markedAsRead'))
    }
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/shared/notifications/read-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      message.success(t('notifications.allMarkedAsRead'))
    }
  })

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/shared/notifications/${notificationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      message.success(t('notifications.deleted'))
    }
  })

  const notifications = notificationsData || []
  
  // Filter notifications
  const filteredNotifications = notifications.filter((notif: Notification) => {
    const matchesType = filterType === 'all' || notif.type.includes(filterType)
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'unread' && !notif.isRead) ||
      (filterStatus === 'read' && notif.isRead)
    const matchesSearch = !searchQuery || 
      notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesType && matchesStatus && matchesSearch
  })

  // Paginate
  const paginatedNotifications = filteredNotifications.slice(
    (page - 1) * pageSize,
    page * pageSize
  )

  const unreadCount = unreadData?.count || 0

  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      'salary': '💰',
      'application': '📝',
      'expense': '💳',
      'attendance': '📅',
      'overtime': '⏱️',
      'announcement': '📢',
      'user': '👤',
      'department': '🏢',
      'default': '🔔'
    }
    
    for (const [key, icon] of Object.entries(iconMap)) {
      if (type.includes(key)) return icon
    }
    return iconMap['default']
  }

  const getNotificationColor = (type: string) => {
    if (type.includes('approved') || type.includes('paid')) return 'green'
    if (type.includes('rejected') || type.includes('alert')) return 'red'
    if (type.includes('submitted') || type.includes('request')) return 'blue'
    if (type.includes('bonus') || type.includes('salary')) return 'gold'
    return 'default'
  }

  const notificationTypes = [
    { label: t('notifications.all'), value: 'all' },
    { label: t('notifications.salary'), value: 'salary' },
    { label: t('notifications.application'), value: 'application' },
    { label: t('notifications.expense'), value: 'expense' },
    { label: t('notifications.attendance'), value: 'attendance' },
    { label: t('notifications.announcement'), value: 'announcement' },
  ]

  const statusOptions = [
    { label: t('notifications.all'), value: 'all' },
    { label: t('notifications.unread'), value: 'unread' },
    { label: t('notifications.read'), value: 'read' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="!border-0 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BellOutlined className="text-blue-500" />
              {t('notifications.title')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {t('notifications.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge count={unreadCount} showZero>
              <Tag color="blue" className="!px-4 !py-1">
                {unreadCount} {t('notifications.unread')}
              </Tag>
            </Badge>
          </div>
        </div>
      </Card>

      {/* Filters and Actions */}
      <Card className="!border-0 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <Input
            placeholder={t('notifications.search')}
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="lg:w-80"
            allowClear
          />

          {/* Type Filter */}
          <Select
            value={filterType}
            onChange={setFilterType}
            options={notificationTypes}
            className="w-full lg:w-48"
            suffixIcon={<FilterOutlined />}
          />

          {/* Status Filter */}
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            options={statusOptions}
            className="w-full lg:w-48"
          />

          {/* Actions */}
          <div className="flex gap-2 ml-auto">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              loading={isLoading}
            >
              {t('common.refresh')}
            </Button>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => markAllAsReadMutation.mutate()}
              loading={markAllAsReadMutation.isPending}
              disabled={unreadCount === 0}
            >
              {t('notifications.markAllRead')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      <Card className="!border-0 shadow-lg">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <CustomSpinner size="large" text="Loading notifications..." />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('notifications.noNotifications')}
            className="py-20"
          />
        ) : (
          <>
            <List
              itemLayout="horizontal"
              dataSource={paginatedNotifications}
              renderItem={(notification: Notification) => (
                <List.Item
                  className={`!px-4 !py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                  }`}
                  actions={[
                    !notification.isRead && (
                      <Button
                        key="read"
                        type="link"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={() => markAsReadMutation.mutate(notification.id)}
                        loading={markAsReadMutation.isPending}
                      >
                        {t('notifications.markRead')}
                      </Button>
                    ),
                    <Button
                      key="delete"
                      type="link"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => deleteNotificationMutation.mutate(notification.id)}
                      loading={deleteNotificationMutation.isPending}
                    >
                      {t('common.delete')}
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div className="text-3xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                    }
                    title={
                      <div className="flex items-center gap-2">
                        <span className={`text-base ${
                          !notification.isRead 
                            ? 'font-semibold text-gray-900 dark:text-white' 
                            : 'font-medium text-gray-600 dark:text-gray-400'
                        }`}>
                          {notification.title}
                        </span>
                        {!notification.isRead && (
                          <Tag color="blue" className="!text-xs">
                            {t('notifications.new')}
                          </Tag>
                        )}
                        <Tag color={getNotificationColor(notification.type)} className="!text-xs">
                          {notification.type.replace(/_/g, ' ')}
                        </Tag>
                      </div>
                    }
                    description={
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />

            {filteredNotifications.length > pageSize && (
              <>
                <Divider />
                <div className="flex justify-center">
                  <Pagination
                    current={page}
                    pageSize={pageSize}
                    total={filteredNotifications.length}
                    onChange={(newPage, newPageSize) => {
                      setPage(newPage)
                      setPageSize(newPageSize || pageSize)
                    }}
                    showSizeChanger
                    showTotal={(total) => `${total} ${t('notifications.total')}`}
                    pageSizeOptions={['10', '20', '50', '100']}
                  />
                </div>
              </>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
