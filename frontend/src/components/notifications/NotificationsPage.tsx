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
  ReloadOutlined,
  FilterOutlined,
  SearchOutlined,
  CrownOutlined,
  TeamOutlined,
  SafetyOutlined,
  ClearOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useTranslations } from 'next-intl'
import { CustomSpinner } from '@/components/ui'
import { PageHeader, EnhancedButton } from '@/components/ui'
import { NotificationsIllustration } from '@/components/ui/illustrations'
import { useRelativeTime } from '@/utils/relativeTime'

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

interface NotificationsPageProps {
  role?: 'ROLE_EMPLOYEE' | 'ROLE_MANAGER' | 'ROLE_ADMIN'
}

// Role-specific color themes
const ROLE_THEMES = {
  ROLE_EMPLOYEE: {
    gradient: 'from-green-500 to-emerald-600',
    darkGradient: 'dark:from-green-600 dark:to-emerald-700',
    bgGradient: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-500 dark:border-green-400',
    textColor: 'text-green-600 dark:text-green-400',
    iconColor: 'text-green-500 dark:text-green-400',
    hoverBg: 'hover:bg-green-50 dark:hover:bg-green-900/30',
    tagColor: 'success',
    badgeColor: 'green',
    icon: <TeamOutlined />,
    roleKey: 'roleEmployee',
  },
  ROLE_MANAGER: {
    gradient: 'from-blue-500 to-cyan-600',
    darkGradient: 'dark:from-blue-600 dark:to-cyan-700',
    bgGradient: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-500 dark:border-blue-400',
    textColor: 'text-blue-600 dark:text-blue-400',
    iconColor: 'text-blue-500 dark:text-blue-400',
    hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-900/30',
    tagColor: 'processing',
    badgeColor: 'blue',
    icon: <SafetyOutlined />,
    roleKey: 'roleManager',
  },
  ROLE_ADMIN: {
    gradient: 'from-purple-500 to-pink-600',
    darkGradient: 'dark:from-purple-600 dark:to-pink-700',
    bgGradient: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-500 dark:border-purple-400',
    textColor: 'text-purple-600 dark:text-purple-400',
    iconColor: 'text-purple-500 dark:text-purple-400',
    hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-900/30',
    tagColor: 'magenta',
    badgeColor: 'purple',
    icon: <CrownOutlined />,
    roleKey: 'roleAdministrator',
  },
};

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ role = 'ROLE_EMPLOYEE' }) => {
  const [searchText, setSearchText] = useState('')
  const [filterType, setFilterType] = useState<string | undefined>(undefined)
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10
  })
  const t = useTranslations()
  const { getRelativeTime, formatDate } = useRelativeTime()
  const queryClient = useQueryClient()

  // Get role-specific theme
  const theme = ROLE_THEMES[role] || ROLE_THEMES.ROLE_EMPLOYEE;

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  // Fetch notifications with proper backend params
  const { data: notificationsResponse, isLoading, refetch } = useQuery({
    queryKey: ['notifications', pagination.current, pagination.pageSize, searchText, filterType, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', pagination.current.toString())
      params.append('limit', pagination.pageSize.toString())
      if (searchText) params.append('search', searchText)
      if (filterType) params.append('type', filterType)
      if (filterStatus) params.append('status', filterStatus)

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/shared/notifications?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      return response.data
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

  // Extract data from response
  const notifications = notificationsResponse?.notifications || []
  const totalNotifications = notificationsResponse?.pagination?.total || 0
  const unreadCount = unreadData?.count || 0

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      console.log('Marking notification as read:', notificationId)
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/shared/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      console.log('Mark as read response:', response.data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      message.success(t('notifications.markedAsRead'))
    },
    onError: (error: any) => {
      console.error('Error marking notification as read:', error)
      message.error(error.response?.data?.message || 'Failed to mark notification as read')
    }
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      console.log('Marking all notifications as read')
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/shared/notifications/read-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      console.log('Mark all as read response:', response.data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      message.success(t('notifications.allMarkedAsRead'))
    },
    onError: (error: any) => {
      console.error('Error marking all notifications as read:', error)
      message.error(error.response?.data?.message || 'Failed to mark all notifications as read')
    }
  })

  // Handle table pagination change
  const handleTableChange = (newPagination: any) => {
    setPagination({
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10,
    })
  }

  // Reset filters
  const handleResetFilters = () => {
    setSearchText('')
    setFilterType(undefined)
    setFilterStatus(undefined)
    setPagination({ current: 1, pageSize: 10 })
    message.success(t('common.filtersResetSuccess'))
  }

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

  const getNotificationTypeLabel = (type: string) => {
    // First try exact match
    const translated = t(`notifications.types.${type}`)
    if (translated && translated !== `notifications.types.${type}`) {
      return translated
    }

    // Fallback: replace underscores and capitalize
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Helper function to translate notification title/message with metadata
  const translateNotificationText = (text: string, metadata: any) => {
    // Check if text is a translation key (contains dots)
    if (text && text.includes('.') && !text.includes(' ')) {
      try {
        // Try to translate the key
        const translated = t(text as any, metadata || {})
        // If translation was successful and not the same as key, return it
        if (translated && translated !== text) {
          return translated
        }
      } catch (error) {
        console.warn('Translation failed for:', text)
      }
    }
    // Return original text if not a translation key or translation failed
    return text
  }

  const notificationTypes = [
    { label: t('notifications.allTypes'), value: undefined },
    { label: t('notifications.salary'), value: 'salary' },
    { label: t('notifications.application'), value: 'application' },
    { label: t('notifications.expense'), value: 'expense' },
    { label: t('notifications.attendance'), value: 'attendance' },
    { label: t('notifications.announcement'), value: 'announcement' },
  ]

  const statusOptions = [
    { label: t('notifications.allStatus'), value: undefined },
    { label: t('notifications.unread'), value: 'unread' },
    { label: t('notifications.read'), value: 'read' },
  ]

  return (
    <div className="space-y-6">
      {/* Modern Header with Role-Specific Colors and Illustration */}
      <PageHeader
        title={t('notifications.title')}
        description={t('notifications.subtitle')}
        icon={<NotificationsIllustration className="w-20 h-20" />}
        gradient={role === 'ROLE_EMPLOYEE' ? 'green' : role === 'ROLE_MANAGER' ? 'blue' : 'purple'}
        action={
          <div className="flex items-center gap-3">
            <Badge count={unreadCount} showZero className="shadow-lg">
              <div className="px-6 py-2 rounded-lg bg-white/25 dark:bg-white/15 backdrop-blur-sm border border-white/30 shadow-lg">
                <span className="text-white font-bold text-lg">
                  {unreadCount} {t('notifications.unread')}
                </span>
              </div>
            </Badge>
          </div>
        }
      />

      {/* Filters and Actions with Role Colors */}
      <Card className={`!border-0 shadow-lg border-t-4 ${theme.borderColor}`}>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <Input
            placeholder={t('notifications.search')}
            prefix={<SearchOutlined className={theme.iconColor} />}
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value)
              setPagination({ ...pagination, current: 1 })
            }}
            className="lg:w-80"
            allowClear
          />

          {/* Type Filter */}
          <Select
            value={filterType}
            onChange={(value) => {
              setFilterType(value)
              setPagination({ ...pagination, current: 1 })
            }}
            options={notificationTypes}
            className="w-full lg:w-48"
            suffixIcon={<FilterOutlined className={theme.iconColor} />}
            allowClear
            placeholder={t('notifications.allTypes')}
          />

          {/* Status Filter */}
          <Select
            value={filterStatus}
            onChange={(value) => {
              setFilterStatus(value)
              setPagination({ ...pagination, current: 1 })
            }}
            options={statusOptions}
            className="w-full lg:w-48"
            allowClear
            placeholder={t('notifications.allStatus')}
          />

          {/* Actions */}
          <div className="flex gap-2 ml-auto">
            <EnhancedButton
              variant="ghost"
              icon={<ClearOutlined />}
              onClick={handleResetFilters}
            >
              {t('common.reset')}
            </EnhancedButton>
            <EnhancedButton
              variant="secondary"
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              loading={isLoading}
            >
              {t('common.refresh')}
            </EnhancedButton>
            <EnhancedButton
              variant="primary"
              icon={<CheckOutlined />}
              onClick={() => markAllAsReadMutation.mutate()}
              loading={markAllAsReadMutation.isPending}
              disabled={unreadCount === 0}
            >
              {t('notifications.markAllRead')}
            </EnhancedButton>
          </div>
        </div>
      </Card>

      {/* Notifications List with Role Colors */}
      <Card className={`!border-0 shadow-lg border-l-4 ${theme.borderColor}`}>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <CustomSpinner size="large" text={t('notifications.loadingNotifications')} />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              imageStyle={{ display: 'none' }}
              description={
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {t('notifications.noNotifications')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You&apos;re all caught up! Check back later for new updates.
                  </p>
                </div>
              }
              className="py-0"
            />
          </div>
        ) : (
          <>
            <List
              itemLayout="horizontal"
              dataSource={notifications}
              renderItem={(notification: Notification) => (
                <List.Item
                  className={`!px-6 !py-5 transition-all duration-200 cursor-pointer border-l-4 ${
                    !notification.isRead
                      ? `${theme.bgGradient} ${theme.borderColor} hover:shadow-md border-opacity-100`
                      : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50'
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
                        className={`${theme.textColor} hover:!${theme.textColor.replace('text-', 'bg-').replace('-600', '-50')}`}
                      >
                        {t('notifications.markRead')}
                      </Button>
                    )
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    avatar={
                      <div className={`text-3xl flex items-center justify-center w-14 h-14 rounded-full ${
                        !notification.isRead
                          ? `${theme.bgGradient} ${theme.borderColor} border-2`
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                    }
                    title={
                      <div className="flex items-start gap-3 flex-wrap">
                        <span className={`text-lg flex-1 ${
                          !notification.isRead
                            ? 'font-semibold text-gray-900 dark:text-white'
                            : 'font-medium text-gray-700 dark:text-gray-300'
                        }`}>
                          {translateNotificationText(notification.title, notification.metadata)}
                        </span>
                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <Tag color={theme.badgeColor} className="!text-xs !py-1 !px-2">
                              {t('notifications.new')}
                            </Tag>
                          )}
                          <Tag color={getNotificationColor(notification.type)} className="!text-xs !py-1 !px-2">
                            {getNotificationTypeLabel(notification.type)}
                          </Tag>
                        </div>
                      </div>
                    }
                    description={
                      <div className="mt-3 space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {translateNotificationText(notification.message, notification.metadata)}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <span className="font-medium">{t('notifications.createdAt')}:</span>
                              <span>{getRelativeTime(notification.createdAt)}</span>
                            </span>
                            {notification.readAt && (
                              <span className="flex items-center gap-1">
                                <span className="font-medium">{t('notifications.readAt')}:</span>
                                <span>{getRelativeTime(notification.readAt)}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />

            {totalNotifications > pagination.pageSize && (
              <>
                <Divider className="dark:border-gray-700" />
                <div className="flex justify-center">
                  <Pagination
                    current={pagination.current}
                    pageSize={pagination.pageSize}
                    total={totalNotifications}
                    onChange={(newPage, newPageSize) => {
                      setPagination({
                        current: newPage,
                        pageSize: newPageSize || pagination.pageSize
                      })
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
