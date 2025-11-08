'use client'

import React, { useState } from 'react'
import { Card, Calendar, Badge, Modal, Form, Input, Select, TimePicker, Button, message } from 'antd'
import { CalendarOutlined, PlusOutlined } from '@ant-design/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import apiClient from '@/lib/api'
import '@/styles/calendar-dark-mode.css'

interface CalendarEventCardProps {
  events: any[]
  onRefresh?: () => void
  showAddButton?: boolean
}

export default function CalendarEventCard({ events, onRefresh, showAddButton = true }: CalendarEventCardProps) {
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

  // Mutations for calendar events
  const createEventMutation = useMutation({
    mutationFn: (data: any) => apiClient.createCalendarEvent(data),
    onSuccess: () => {
      message.success('Event created successfully!')
      setIsModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['manager-dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['employee-dashboard-stats'] })
      if (onRefresh) onRefresh()
    },
    onError: () => {
      message.error('Failed to create event')
    }
  })

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiClient.updateCalendarEvent(id, data),
    onSuccess: () => {
      message.success('Event updated successfully!')
      setIsModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['manager-dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['employee-dashboard-stats'] })
      if (onRefresh) onRefresh()
    }
  })

  const deleteEventMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteCalendarEvent(id),
    onSuccess: () => {
      message.success('Event deleted successfully!')
      setIsModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['manager-dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['employee-dashboard-stats'] })
      if (onRefresh) onRefresh()
    }
  })

  const handleDateSelect = (date: dayjs.Dayjs) => {
    setSelectedDate(date)
    const dateStr = date.format('YYYY-MM-DD')
    const existingEvent = events.find((e: any) => e.date === dateStr)

    if (existingEvent) {
      setModalMode('edit')
      setSelectedEvent(existingEvent)
      form.setFieldsValue({
        title: existingEvent.title,
        type: existingEvent.type,
        time: existingEvent.time ? dayjs(existingEvent.time, 'HH:mm') : null,
        description: existingEvent.description
      })
    } else {
      setModalMode('create')
      setSelectedEvent(null)
      form.resetFields()
    }
    setIsModalOpen(true)
  }

  const handleAddEvent = () => {
    setSelectedDate(dayjs())
    setModalMode('create')
    setSelectedEvent(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const handleModalCancel = () => {
    setIsModalOpen(false)
    form.resetFields()
    setSelectedEvent(null)
  }

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      if (!selectedDate) {
        message.error('Please select a date from the calendar')
        return
      }

      const eventData = {
        title: values.title,
        type: values.type,
        date: selectedDate.format('YYYY-MM-DD'),
        time: values.time ? values.time.format('HH:mm') : null,
        description: values.description || null
      }

      if (modalMode === 'create') {
        createEventMutation.mutate(eventData)
      } else if (selectedEvent) {
        updateEventMutation.mutate({
          id: selectedEvent.id,
          data: eventData
        })
      }
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      Modal.confirm({
        title: 'Delete Event',
        content: 'Are you sure you want to delete this event?',
        okText: 'Delete',
        okType: 'danger',
        onOk: () => deleteEventMutation.mutate(selectedEvent.id)
      })
    }
  }

  return (
    <>
      <Card
        title={
          <span className="text-2xl font-bold flex items-center text-gray-800 dark:text-gray-100">
            <CalendarOutlined className="mr-3 text-blue-500 dark:text-blue-400" />
            <span className="text-gray-800 dark:text-gray-100">Calendar & Events</span>
          </span>
        }
        extra={
          showAddButton && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAddEvent}
              className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              Add Event
            </Button>
          )
        }
        className="shadow-lg border-0 bg-white dark:bg-gray-800 transition-colors"
      >
        <div className="admin-calendar">
          <Calendar
            fullscreen={false}
            cellRender={(current, info) => {
              if (info.type !== 'date') return info.originNode
              
              const dateStr = current.format('YYYY-MM-DD')
              const dayEvents = events.filter((event: any) => 
                dayjs(event.date).format('YYYY-MM-DD') === dateStr
              )
              
              return (
                <div className="space-y-1">
                  {dayEvents.map((event: any) => (
                    <Badge
                      key={event.id}
                      status={event.type === 'holiday' ? 'success' : 'processing'}
                      text={
                        <span className="text-xs truncate block font-medium text-gray-700 dark:text-gray-300">
                          {event.title}
                        </span>
                      }
                    />
                  ))}
                </div>
              )
            }}
            onSelect={handleDateSelect}
            className="dark-mode-calendar"
          />
        </div>
      </Card>

      <Modal
        title={
          <span className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {modalMode === 'create' ? 'Create New Event' : 'Edit Event'}
          </span>
        }
        open={isModalOpen}
        onOk={handleModalSubmit}
        onCancel={handleModalCancel}
        width={600}
        className="dark-mode-modal"
        footer={[
          modalMode === 'edit' && (
            <Button 
              key="delete" 
              danger 
              onClick={handleDeleteEvent}
              loading={deleteEventMutation.isPending}
              className="dark:bg-red-600 dark:hover:bg-red-700"
            >
              Delete
            </Button>
          ),
          <Button 
            key="cancel" 
            onClick={handleModalCancel}
            className="dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
          >
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={handleModalSubmit}
            loading={createEventMutation.isPending || updateEventMutation.isPending}
            className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            {modalMode === 'create' ? 'Create' : 'Update'}
          </Button>
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          className="mt-4"
        >
          <Form.Item
            name="title"
            label={<span className="text-gray-700 dark:text-gray-300">Event Title</span>}
            rules={[{ required: true, message: 'Please enter event title' }]}
          >
            <Input 
              placeholder="e.g., Team Meeting" 
              size="large"
              className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            />
          </Form.Item>

          <Form.Item
            name="type"
            label={<span className="text-gray-700 dark:text-gray-300">Event Type</span>}
            rules={[{ required: true, message: 'Please select event type' }]}
          >
            <Select 
              size="large" 
              placeholder="Select event type"
              className="dark:bg-gray-700"
            >
              <Select.Option value="meeting">Meeting</Select.Option>
              <Select.Option value="deadline">Deadline</Select.Option>
              <Select.Option value="holiday">Holiday</Select.Option>
              <Select.Option value="birthday">Birthday</Select.Option>
              <Select.Option value="training">Training</Select.Option>
              <Select.Option value="review">Review</Select.Option>
            </Select>
          </Form.Item>

          {/* Show selected date as read-only */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors">
            <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              📅 Selected Date
            </div>
            <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
              {selectedDate?.format('MMMM DD, YYYY')}
            </div>
          </div>

          <Form.Item
            name="time"
            label={<span className="text-gray-700 dark:text-gray-300">Time (Optional)</span>}
          >
            <TimePicker 
              size="large" 
              className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              format="HH:mm"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span className="text-gray-700 dark:text-gray-300">Description (Optional)</span>}
          >
            <Input.TextArea 
              rows={4} 
              placeholder="Add event details..."
              className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:placeholder-gray-400"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
