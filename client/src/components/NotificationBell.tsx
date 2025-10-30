'use client';

import React, { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Button, Typography, Empty, App } from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  FileTextOutlined,
  DollarOutlined,
  NotificationOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { api } from '@/src/lib/api';
import { useAuthStore } from '@/src/store/useAuthStore';

const { Text, Title } = Typography;

interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  relatedId?: number;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const router = useRouter();
  const { user } = useAuthStore();
  const { message } = App.useApp();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/shared/notifications');
      if (response.data.notifications) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/api/shared/notifications/unread-count');
      if (response.data.count !== undefined) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();

      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  // Mark notification as read and navigate
  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.isRead) {
        await api.put(`/api/shared/notifications/${notification.id}/read`);
        fetchNotifications();
        fetchUnreadCount();
      }

      // Navigate based on notification type
      switch (notification.type) {
        case 'announcement':
          if (user?.role === 'ROLE_ADMIN') {
            router.push('/dashboard/admin/announcements');
          } else if (user?.role === 'ROLE_MANAGER') {
            router.push('/dashboard/manager/announcements');
          } else {
            router.push('/dashboard/employee/announcements');
          }
          break;
        case 'application':
          if (user?.role === 'ROLE_ADMIN') {
            router.push('/dashboard/admin/applications');
          } else if (user?.role === 'ROLE_MANAGER') {
            router.push('/dashboard/manager/applications');
          } else {
            router.push('/dashboard/employee/applications');
          }
          break;
        case 'salary':
          router.push('/dashboard/employee/salary-history');
          break;
        case 'leave':
          router.push('/dashboard/employee/leave');
          break;
        default:
          break;
      }

      setDropdownVisible(false);
    } catch (error) {
      console.error('Error handling notification click:', error);
      message.error('Failed to open notification');
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      await api.put('/api/shared/notifications/read-all');
      await fetchNotifications();
      await fetchUnreadCount();
      message.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      message.error('Failed to mark all as read');
    } finally {
      setLoading(false);
    }
  };

  // Delete notification
  const handleDeleteNotification = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await api.delete(`/api/shared/notifications/${id}`);
      await fetchNotifications();
      await fetchUnreadCount();
      message.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      message.error('Failed to delete notification');
    } finally {
      setLoading(false);
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <NotificationOutlined style={{ color: '#1890ff' }} />;
      case 'application':
        return <FileTextOutlined style={{ color: '#52c41a' }} />;
      case 'salary':
        return <DollarOutlined style={{ color: '#faad14' }} />;
      case 'leave':
        return <CalendarOutlined style={{ color: '#722ed1' }} />;
      default:
        return <BellOutlined style={{ color: '#8c8c8c' }} />;
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const dropdownContent = (
    <div style={{ width: 360, maxHeight: 480, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title level={5} style={{ margin: 0 }}>
          Notifications
        </Title>
        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            icon={<CheckOutlined />}
            onClick={handleMarkAllAsRead}
            loading={loading}
          >
            Mark all read
          </Button>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No notifications"
            style={{ padding: '40px 0' }}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(notification) => (
              <List.Item
                key={notification.id}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  backgroundColor: notification.isRead ? 'transparent' : '#f0f7ff',
                  borderBottom: '1px solid #f0f0f0',
                }}
                onClick={() => handleNotificationClick(notification)}
                actions={[
                  <Button
                    key="delete"
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => handleDeleteNotification(notification.id, e)}
                    loading={loading}
                  />,
                ]}
              >
                <List.Item.Meta
                  avatar={getNotificationIcon(notification.type)}
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong={!notification.isRead}>{notification.title}</Text>
                      {!notification.isRead && (
                        <Badge status="processing" />
                      )}
                    </div>
                  }
                  description={
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {notification.message}
                      </Text>
                      <div>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {formatTime(notification.createdAt)}
                        </Text>
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );

  return (
    <Dropdown
      open={dropdownVisible}
      onOpenChange={setDropdownVisible}
      popupRender={() => dropdownContent}
      trigger={['click']}
      placement="bottomRight"
    >
      <Badge count={unreadCount} size="small" offset={[-5, 5]}>
        <BellOutlined
          style={{
            fontSize: 20,
            cursor: 'pointer',
            color: unreadCount > 0 ? '#1890ff' : 'inherit',
          }}
        />
      </Badge>
    </Dropdown>
  );
};
