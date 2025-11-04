'use client'

import React, { useState } from 'react'
import { Calendar, Badge, Modal, Form, Input, Select, TimePicker, Button, Space, message, Popconfirm, Typography } from 'antd'
import type { Dayjs } from 'dayjs'
import type { BadgeProps } from 'antd'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
} from '@ant-design/icons'

const { TextArea } = Input
const { Title, Text } = Typography

interface CalendarEvent {
  id: number
  title: string
  type: 'meeting' | 'deadline' | 'holiday' | 'birthday' | 'training' | 'review'
  date: string
  time?: string | null
  description?: string | null
  createdBy: number
  createdAt: string
  updatedAt: string
}

export function DashboardCalendar() {
  const t = useTranslations()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  // Fetch calendar events
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shared/calendar`, {
        headers: {
          'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch events')
      const data = await response.json()
      return data.data || []
    },
  })

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shared/calendar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
        },
        body: JSON.stringify({
          title: values.title,
          type: values.type,
          date: values.date.format('YYYY-MM-DD'),
          time: values.time ? values.time.format('HH:mm') : null,
          description: values.description,
        }),
      })
      if (!response.ok) throw new Error('Failed to create event')
      return response.json()
    },
    onSuccess: () => {
      message.success(t('calendar.eventCreated'))
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      setIsModalVisible(false)
      form.resetFields()
    },
    onError: () => {
      message.error(t('calendar.eventCreateFailed'))
    },
  })

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: any }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shared/calendar/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
        },
        body: JSON.stringify({
          title: values.title,
          type: values.type,
          date: values.date.format('YYYY-MM-DD'),
          time: values.time ? values.time.format('HH:mm') : null,
          description: values.description,
        }),
      })
      if (!response.ok) throw new Error('Failed to update event')
      return response.json()
    },
    onSuccess: () => {
      message.success(t('calendar.eventUpdated'))
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      setIsModalVisible(false)
      setSelectedEvent(null)
      form.resetFields()
    },
    onError: () => {
      message.error(t('calendar.eventUpdateFailed'))
    },
  })

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shared/calendar/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
        },
      })
      if (!response.ok) throw new Error('Failed to delete event')
      return response.json()
    },
    onSuccess: () => {
      message.success(t('calendar.eventDeleted'))
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      setIsModalVisible(false)
      setSelectedEvent(null)
    },
    onError: () => {
      message.error(t('calendar.eventDeleteFailed'))
    },
  })

  const getListData = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD')
    return (eventsData || []).filter((event: CalendarEvent) => 
      dayjs(event.date).format('YYYY-MM-DD') === dateStr
    )
  }

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value)
    return (
      <ul className="list-none p-0">
        {listData.map((item: CalendarEvent) => (
          <li key={item.id}>
            <Badge
              status={getEventBadgeStatus(item.type)}
              text={
                <span 
                  className="text-xs truncate cursor-pointer dark:text-gray-200"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEventClick(item)
                  }}
                >
                  {item.title}
                </span>
              }
            />
          </li>
        ))}
      </ul>
    )
  }

  const getEventBadgeStatus = (type: string): BadgeProps['status'] => {
    const statusMap: Record<string, BadgeProps['status']> = {
      meeting: 'processing',
      deadline: 'error',
      holiday: 'success',
      birthday: 'warning',
      training: 'processing',
      review: 'default',
    }
    return statusMap[type] || 'default'
  }

  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date)
    setSelectedEvent(null)
    form.setFieldsValue({
      date: date,
      time: null,
      title: '',
      type: 'meeting',
      description: '',
    })
    setIsModalVisible(true)
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    form.setFieldsValue({
      title: event.title,
      type: event.type,
      date: dayjs(event.date),
      time: event.time ? dayjs(event.time, 'HH:mm') : null,
      description: event.description,
    })
    setIsModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (selectedEvent) {
        updateEventMutation.mutate({ id: selectedEvent.id, values })
      } else {
        createEventMutation.mutate(values)
      }
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const handleDelete = () => {
    if (selectedEvent) {
      deleteEventMutation.mutate(selectedEvent.id)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <Space>
          <CalendarOutlined className="text-blue-500 text-xl" />
          <Title level={4} className="!mb-0 dark:text-white">
            {t('calendar.title')}
          </Title>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleDateSelect(dayjs())}
        >
          {t('calendar.addEvent')}
        </Button>
      </div>

      <Calendar
        dateCellRender={dateCellRender}
        onSelect={handleDateSelect}
        className="dark:text-gray-200"
      />

      <Modal
        title={selectedEvent ? t('calendar.editEvent') : t('calendar.addEvent')}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false)
          setSelectedEvent(null)
          form.resetFields()
        }}
        footer={[
          selectedEvent && (
            <Popconfirm
              key="delete"
              title={t('calendar.deleteConfirm')}
              onConfirm={handleDelete}
              okText={t('common.yes')}
              cancelText={t('common.no')}
            >
              <Button danger icon={<DeleteOutlined />}>
                {t('common.delete')}
              </Button>
            </Popconfirm>
          ),
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            {t('common.cancel')}
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={createEventMutation.isPending || updateEventMutation.isPending}
            onClick={handleSubmit}
          >
            {selectedEvent ? t('common.update') : t('common.create')}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label={t('calendar.eventTitle')}
            rules={[{ required: true, message: t('calendar.titleRequired') }]}
          >
            <Input placeholder={t('calendar.eventTitlePlaceholder')} />
          </Form.Item>

          <Form.Item
            name="type"
            label={t('calendar.eventType')}
            rules={[{ required: true, message: t('calendar.typeRequired') }]}
          >
            <Select>
              <Select.Option value="meeting">{t('calendar.types.meeting')}</Select.Option>
              <Select.Option value="deadline">{t('calendar.types.deadline')}</Select.Option>
              <Select.Option value="holiday">{t('calendar.types.holiday')}</Select.Option>
              <Select.Option value="birthday">{t('calendar.types.birthday')}</Select.Option>
              <Select.Option value="training">{t('calendar.types.training')}</Select.Option>
              <Select.Option value="review">{t('calendar.types.review')}</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="date"
            label={t('calendar.date')}
            rules={[{ required: true, message: t('calendar.dateRequired') }]}
          >
            <Input type="date" />
          </Form.Item>

          <Form.Item name="time" label={t('calendar.time')}>
            <TimePicker format="HH:mm" className="w-full" />
          </Form.Item>

          <Form.Item name="description" label={t('calendar.description')}>
            <TextArea rows={4} placeholder={t('calendar.descriptionPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
