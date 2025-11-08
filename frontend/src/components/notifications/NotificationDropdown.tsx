'use client'

import React, { useState } from 'react'
import { Dropdown, Badge, Button, Empty, Spin, Divider, Tag } from 'antd'
import { BellOutlined, CheckOutlined, EyeOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from 'next-intl'
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

interface NotificationDropdownProps {
  locale: string
  role: 'admin' | 'manager' | 'employee'
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ locale, role }) => {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const t = useTranslations()
  const { getRelativeTime, formatDate } = useRelativeTime()
  const queryClient = useQueryClient()

  // Get token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/shared/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data.notifications || []
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !!token && isAuthenticated
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
    refetchInterval: 30000,
    enabled: !!token && isAuthenticated
  })

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      console.log('Dropdown: Marking notification as read:', notificationId)
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/shared/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      console.log('Dropdown: Mark as read response:', response.data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (error: any) => {
      console.error('Dropdown: Error marking notification as read:', error)
    }
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      console.log('Dropdown: Marking all notifications as read')
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/shared/notifications/read-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      console.log('Dropdown: Mark all as read response:', response.data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (error: any) => {
      console.error('Dropdown: Error marking all notifications as read:', error)
    }
  })

  // Delete notification mutation - DISABLED (notifications should never be deleted)
  // const deleteNotificationMutation = useMutation({
  //   mutationFn: async (notificationId: number) => {
  //     await axios.delete(
  //       `${process.env.NEXT_PUBLIC_API_URL}/api/shared/notifications/${notificationId}`,
  //       { headers: { Authorization: `Bearer ${token}` } }
  //     )
  //   },
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ['notifications'] })
  //   }
  // })

  const unreadCount = unreadData?.count || 0
  // Only show UNREAD notifications in dropdown
  const unreadNotifications = notifications?.filter((n: Notification) => !n.isRead) || []
  const recentNotifications = unreadNotifications.slice(0, 5)

  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      'salary_generated': '💰',
      'salary_updated': '📊',
      'salary_approved': '✅',
      'salary_paid': '💵',
      'bonus_added': '🎁',
      'application_submitted': '📝',
      'application_approved': '✅',
      'application_rejected': '❌',
      'expense_submitted': '💳',
      'expense_approved': '✅',
      'expense_rejected': '❌',
      'expense_paid': '💵',
      'attendance_marked': '📅',
      'late_arrival_alert': '⏰',
      'absence_alert': '⚠️',
      'overtime_approved': '⏱️',
      'announcement_created': '📢',
      'user_created': '🎉',
      'department_assigned': '🏢',
      'default': '🔔'
    }
    return iconMap[type] || iconMap['default']
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

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id)
    }
    setOpen(false)
    // Navigate to notifications page
    router.push(`/${locale}/${role}/notifications`)
  }

  const handleViewAll = () => {
    setOpen(false)
    router.push(`/${locale}/${role}/notifications`)
  }

  const handleMarkAllRead = () => {
    markAllAsReadMutation.mutate()
  }

  // handleDelete - DISABLED (notifications should never be deleted)
  // const handleDelete = (e: React.MouseEvent, notificationId: number) => {
  //   e.stopPropagation()
  //   deleteNotificationMutation.mutate(notificationId)
  // }

  const dropdownContent = (
    <div className="w-96 max-h-[500px] overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-base">
            {t('notifications.title')}
          </h3>
          {unreadCount > 0 && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={handleMarkAllRead}
              className="!text-white hover:!text-blue-100"
              loading={markAllAsReadMutation.isPending}
            >
              {t('notifications.markAllRead')}
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto max-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spin />
          </div>
        ) : recentNotifications.length === 0 ? (
          <div className="py-12">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('notifications.noNotifications')}
            />
          </div>
        ) : (
          recentNotifications.map((notification: Notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`px-4 py-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-750 ${
                !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                {/* Icon */}
                <div className={`text-2xl flex-shrink-0 mt-1 w-10 h-10 rounded-full flex items-center justify-center ${
                  !notification.isRead
                    ? 'bg-blue-100 dark:bg-blue-800/50'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className={`text-sm font-semibold flex-1 pr-2 ${
                      !notification.isRead
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {notification.title}
                    </h4>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!notification.isRead && (
                        <Tag color="blue" className="!text-xs !py-0.5 !px-2 !m-0">
                          {t('notifications.new')}
                        </Tag>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 leading-relaxed">
                    {notification.message}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Tag color={getNotificationColor(notification.type)} className="!text-xs !py-0.5 !px-2">
                        {getNotificationTypeLabel(notification.type)}
                      </Tag>
                      <span className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                        {getRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {recentNotifications.length > 0 && (
        <>
          <Divider className="!my-0" />
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800">
            <Button
              type="primary"
              block
              icon={<EyeOutlined />}
              onClick={handleViewAll}
              className="!bg-blue-500 hover:!bg-blue-600 !border-blue-500"
            >
              {t('notifications.viewAll')}
            </Button>
          </div>
        </>
      )}
    </div>
  )

  return (
    <Dropdown
      popupRender={() => dropdownContent}
      trigger={['click']}
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <button className="relative flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md group">
        <BellOutlined className="text-lg text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-gradient-to-br from-red-500 to-pink-600 rounded-full shadow-lg animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        <span className="text-sm font-semibold text-gray-900 dark:text-white hidden md:inline">
          {unreadCount > 0 ? `${unreadCount} ${t('notifications.new')}` : t('notifications.title')}
        </span>
      </button>
    </Dropdown>
  )
}
