'use client'

import React from 'react'
import { Row, Col, Card, List, Avatar, Badge, Tag, Typography, Space, Button } from 'antd'
import {
  BellOutlined,
  UserOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { createLocalizedPath, getCurrentLocale } from '@/lib/localized-routes'

const { Text } = Typography

interface DashboardActivityProps {
  announcements: any[]
  recentUsers: any[]
}

export function DashboardActivity({ announcements, recentUsers }: DashboardActivityProps) {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const locale = getCurrentLocale(pathname)

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card
          title={
            <Space>
              <BellOutlined className="text-orange-500" />
              <Text strong className="dark:text-white">{t('dashboard.recentAnnouncements')}</Text>
            </Space>
          }
          extra={
            <Button
              type="link"
              onClick={() => router.push(createLocalizedPath(locale, '/admin/announcements'))}
              className="dark:text-blue-400"
            >
              {t('common.viewAll')}
            </Button>
          }
          className="dark:bg-gray-800 dark:border-gray-700"
        >
          <List
            dataSource={announcements}
            renderItem={(item: any) => (
              <List.Item
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => router.push(createLocalizedPath(locale, `/admin/announcements/${item.id}`))}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<BellOutlined />} className="bg-blue-500" />}
                  title={<Text className="dark:text-white">{item.title}</Text>}
                  description={
                    <Text className="text-gray-500 dark:text-gray-400">
                      {dayjs(item.date || item.createdAt).format('MMM DD, YYYY')}
                    </Text>
                  }
                />
                {item.isActive && <Badge status="success" text={t('common.active')} />}
              </List.Item>
            )}
            locale={{ emptyText: t('dashboard.noAnnouncements') }}
          />
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card
          title={
            <Space>
              <UserOutlined className="text-purple-500" />
              <Text strong className="dark:text-white">{t('dashboard.newEmployees')}</Text>
            </Space>
          }
          extra={
            <Button
              type="link"
              onClick={() => router.push(createLocalizedPath(locale, '/admin/users'))}
              className="dark:text-blue-400"
            >
              {t('common.viewAll')}
            </Button>
          }
          className="dark:bg-gray-800 dark:border-gray-700"
        >
          <List
            dataSource={recentUsers}
            renderItem={(item: any) => (
              <List.Item
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => router.push(createLocalizedPath(locale, `/admin/users/${item.id}`))}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      style={{ backgroundColor: '#87d068' }}
                      icon={<UserOutlined />}
                    />
                  }
                  title={<Text className="dark:text-white">{item.fullName}</Text>}
                  description={
                    <Space direction="vertical" size={0}>
                      <Text className="text-gray-500 dark:text-gray-400 text-sm">
                        {item.jobTitle || t('common.employee')}
                      </Text>
                      <Text className="text-gray-400 dark:text-gray-500 text-xs">
                        {t('dashboard.joined')} {dayjs(item.createdAt).format('MMM DD, YYYY')}
                      </Text>
                    </Space>
                  }
                />
                <Tag color={item.active ? 'green' : 'red'}>
                  {item.active ? t('common.active') : t('common.inactive')}
                </Tag>
              </List.Item>
            )}
            locale={{ emptyText: t('dashboard.noNewEmployees') }}
          />
        </Card>
      </Col>
    </Row>
  )
}
