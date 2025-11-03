'use client'

import React, { useState } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Breadcrumb,
  Dropdown,
  message,
  Modal,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  HomeOutlined,
  NotificationOutlined,
  CheckCircleOutlined,
  PoweroffOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'

const { confirm } = Modal
const { Text } = Typography

interface AnnouncementListPageProps {
  role: 'admin' | 'manager' | 'employee'
}

export function AnnouncementListPage({ role }: AnnouncementListPageProps) {
  const t = useTranslations()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchText, setSearchText] = useState('')

  const basePath = role === 'admin' ? '/admin' : role === 'manager' ? '/manager' : '/employee'
  const dashboardPath = `${basePath}/dashboard`
  const listPath = `${basePath}/announcements`
  const addPath = `${basePath}/announcements/add`

  // Fetch announcements
  const { data: announcementsData, isLoading } = useQuery({
    queryKey: ['announcements', role],
    queryFn: () => apiClient.getAnnouncements(),
  })

  // Delete mutation (admin and manager only)
  const deleteAnnouncementMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteAnnouncement(id),
    onSuccess: () => {
      message.success(t('announcements.deleteSuccess'))
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || t('announcements.deleteError'))
    },
  })

  // Toggle status mutation (admin only)
  const toggleStatusMutation = useMutation({
    mutationFn: (id: number) => apiClient.toggleAnnouncementStatus(id),
    onSuccess: () => {
      message.success(t('announcements.statusUpdateSuccess'))
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || t('announcements.statusUpdateError'))
    },
  })

  // Mark as read mutation (employee only)
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => apiClient.markAnnouncementAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
  })

  const handleDelete = (id: number, title: string) => {
    confirm({
      title: t('announcements.deleteAnnouncement'),
      content: t('announcements.deleteConfirm', { title }),
      okText: t('common.delete'),
      okType: 'danger',
      onOk: () => deleteAnnouncementMutation.mutate(id),
    })
  }

  const handleToggleStatus = (id: number) => {
    toggleStatusMutation.mutate(id)
  }

  const handleView = (id: number) => {
    router.push(`${listPath}/${id}`)
    if (role === 'employee') {
      markAsReadMutation.mutate(id)
    }
  }

  const announcements = Array.isArray(announcementsData)
    ? announcementsData
    : announcementsData?.announcements || []

  const filteredAnnouncements = announcements.filter((announcement: any) =>
    announcement.title?.toLowerCase().includes(searchText.toLowerCase()) ||
    announcement.description?.toLowerCase().includes(searchText.toLowerCase())
  )

  const columns: ColumnsType<any> = [
    {
      title: t('announcements.announcementTitle'),
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <Space>
          <NotificationOutlined />
          <span>{text}</span>
          {role === 'employee' && record.isRead && (
            <Tag color="green" icon={<CheckCircleOutlined />}>{t('announcements.read')}</Tag>
          )}
          {role === 'employee' && !record.isRead && (
            <Tag color="orange">{t('announcements.unread')}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: t('announcements.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => (
        <Text ellipsis style={{ maxWidth: 400 }}>
          {text}
        </Text>
      ),
    },
    ...(role !== 'employee' ? [{
      title: t('announcements.department'),
      dataIndex: ['department', 'departmentName'],
      key: 'department',
      render: (text: string) => text || t('announcements.notAvailable'),
    }] : []),
    {
      title: t('announcements.date'),
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a: any, b: any) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    ...(role !== 'employee' ? [{
      title: t('announcements.status'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? t('announcements.active') : t('announcements.inactive')}
        </Tag>
      ),
    }] : []),
    {
      title: t('announcements.createdBy'),
      dataIndex: ['creator', 'fullName'],
      key: 'creator',
      render: (text: string) => text || t('announcements.unknown'),
    },
    {
      title: t('announcements.actions'),
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_: any, record: any) => {
        const menuItems: any[] = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: t('announcements.viewDetails'),
            onClick: () => handleView(record.id),
          },
        ]

        if (role === 'admin' || role === 'manager') {
          menuItems.push(
            {
              key: 'edit',
              icon: <EditOutlined />,
              label: t('common.edit'),
              onClick: () => router.push(`${listPath}/${record.id}/edit`),
            },
            {
              key: 'delete',
              icon: <DeleteOutlined />,
              label: t('common.delete'),
              danger: true,
              onClick: () => handleDelete(record.id, record.title),
            }
          )
        }

        if (role === 'admin') {
          menuItems.push({
            key: 'toggle',
            icon: <PoweroffOutlined />,
            label: record.isActive ? t('announcements.deactivate') : t('announcements.activate'),
            onClick: () => handleToggleStatus(record.id),
          })
        }

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          {
            title: (
              <span className="flex items-center cursor-pointer" onClick={() => router.push(dashboardPath)}>
                <HomeOutlined className="mr-1" />
                {t('common.dashboard')}
              </span>
            ),
          },
          {
            title: t('announcements.title'),
          },
        ]}
      />

      {/* Page Header */}
      <Card>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold m-0">
              {role === 'admin' ? t('announcements.allAnnouncements') : 
               role === 'manager' ? t('announcements.departmentAnnouncements') : 
               t('announcements.myAnnouncements')}
            </h1>
            <p className="text-gray-500 mt-2">
              {role === 'admin' ? t('announcements.subtitle') :
               role === 'manager' ? t('announcements.subtitleManager') :
               t('announcements.subtitleEmployee')}
            </p>
          </div>
          {(role === 'admin' || role === 'manager') && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => router.push(addPath)}
            >
              {t('announcements.createAnnouncement')}
            </Button>
          )}
        </div>
      </Card>

      {/* Announcements Table */}
      <Card>
        <div className="mb-4">
          <Input
            placeholder={t('announcements.searchPlaceholder')}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredAnnouncements}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 'max-content' }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => t('announcements.totalItems', { total }),
          }}
        />
      </Card>
    </div>
  )
}
