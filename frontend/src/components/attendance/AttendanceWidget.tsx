'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button, Typography, Badge, Tooltip, Space, Statistic, Row, Col, Modal, Form, Input, TimePicker, message } from 'antd'
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
  EditOutlined,
  LoginOutlined,
  LogoutOutlined,
  CalendarOutlined,
  FireOutlined,
  TrophyOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { usePathname } from 'next/navigation'
import dayjs from 'dayjs'
import { createLocalizedPath, getCurrentLocale } from '@/lib/localized-routes'

const { Title, Text } = Typography

interface AttendanceRecord {
  id: string
  date: string
  checkIn?: string
  checkOut?: string
  workingHours?: number
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave' | 'holiday'
  isLate: boolean
  lateMinutes?: number
  isEarlyDeparture: boolean
  earlyDepartureMinutes?: number
  overtimeMinutes?: number
  breakDuration?: number
  notes?: string
}

interface AttendanceSummary {
  totalWorkingDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  halfDays: number
  leaveDays: number
  holidayDays: number
  totalWorkingHours: number
  totalOvertimeHours: number
  attendancePercentage: number
}

export function AttendanceWidget() {
  const pathname = usePathname()
  const locale = getCurrentLocale(pathname)
  const [correctionModalVisible, setCorrectionModalVisible] = useState(false)
  const [correctionForm] = Form.useForm()
  const queryClient = useQueryClient()

  // Get Today&apos;s attendance
  const { data: todayAttendance, isLoading: todayLoading } = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: () => apiClient.getTodayAttendance(),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Get attendance summary for current month
  const { data: monthlySummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['attendance', 'summary', new Date().getMonth(), new Date().getFullYear()],
    queryFn: () => apiClient.getMyAttendanceSummary({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    }),
  })

  // Get recent attendance records
  const { data: recentRecords } = useQuery({
    queryKey: ['attendance', 'recent'],
    queryFn: () => apiClient.getMyAttendance({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    }),
  })

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: (data: { notes?: string; location?: string }) =>
      apiClient.checkIn(data),
    onSuccess: () => {
      message.success('Successfully checked in!')
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
    onError: (error: any) => {
      message.error(error.message || 'Failed to check in')
    }
  })

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: (data: { notes?: string; location?: string }) =>
      apiClient.checkOut(data),
    onSuccess: () => {
      message.success('Successfully checked out!')
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
    onError: (error: any) => {
      message.error(error.message || 'Failed to check out')
    }
  })

  // Correction request mutation
  const correctionMutation = useMutation({
    mutationFn: (data: any) => apiClient.requestAttendanceCorrection(data),
    onSuccess: () => {
      message.success('Correction request submitted successfully!')
      setCorrectionModalVisible(false)
      correctionForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
    onError: (error: any) => {
      message.error(error.message || 'Failed to submit correction request')
    }
  })

  const currentTime = dayjs().format('HH:mm:ss')
  const isWorkHours = dayjs().hour() >= 6 && dayjs().hour() <= 22
  const canCheckIn = !todayAttendance?.checkIn && isWorkHours
  const canCheckOut = todayAttendance?.checkIn && !todayAttendance?.checkOut && isWorkHours

  const handleCheckIn = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          checkInMutation.mutate({
            location: `${position.coords.latitude}, ${position.coords.longitude}`,
            notes: `Check-in at ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`
          })
        },
        (error) => {
          checkInMutation.mutate({
            notes: `Check-in at ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`
          })
        }
      )
    } else {
      checkInMutation.mutate({
        notes: `Check-in at ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`
      })
    }
  }

  const handleCheckOut = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          checkOutMutation.mutate({
            location: `${position.coords.latitude}, ${position.coords.longitude}`,
            notes: `Check-out at ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`
          })
        },
        (error) => {
          checkOutMutation.mutate({
            notes: `Check-out at ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`
          })
        }
      )
    } else {
      checkOutMutation.mutate({
        notes: `Check-out at ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`
      })
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      present: 'green',
      absent: 'red',
      late: 'orange',
      half_day: 'yellow',
      on_leave: 'blue',
      holiday: 'purple'
    }
    return colors[status as keyof typeof colors] || 'default'
  }

  const getStatusIcon = (record: AttendanceRecord) => {
    if (record.isLate) return <ExclamationCircleOutlined className="text-orange-500" />
    if (record.status === 'present') return <CheckCircleOutlined className="text-green-500" />
    if (record.status === 'absent') return <ExclamationCircleOutlined className="text-red-500" />
    if (record.status === 'on_leave') return <CalendarOutlined className="text-blue-500" />
    if (record.status === 'holiday') return <FireOutlined className="text-purple-500" />
    return <ClockCircleOutlined />
  }

  const handleCorrectionRequest = (values: any) => {
    correctionMutation.mutate({
      date: dayjs(values.date).format('YYYY-MM-DD'),
      requestType: values.requestType,
      originalTimes: {
        checkIn: todayAttendance?.checkIn,
        checkOut: todayAttendance?.checkOut
      },
      requestedTimes: {
        checkIn: values.checkIn ? dayjs(values.checkIn).format('HH:mm:ss') : undefined,
        checkOut: values.checkOut ? dayjs(values.checkOut).format('HH:mm:ss') : undefined
      },
      reason: values.reason
    })
  }

  return (
    <>
      {/* Today&apos;s Attendance Card */}
      <Card
        title={
          <div className="flex items-center space-x-2">
            <ClockCircleOutlined className="text-blue-500" />
            <span>Today&apos;s Attendance</span>
            <Badge
              status={todayAttendance?.status === 'present' ? 'success' : 'processing'}
              text={todayAttendance?.status?.replace('_', ' ').toUpperCase() || 'NOT RECORDED'}
            />
          </div>
        }
        extra={
          <Tooltip title="Request Attendance Correction">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => setCorrectionModalVisible(true)}
            />
          </Tooltip>
        }
        className="mb-4"
        loading={todayLoading}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <LoginOutlined className="text-green-500" />
                  <span className="text-sm font-medium">Check In</span>
                </div>
                <Text strong>
                  {todayAttendance?.checkIn ?
                    dayjs(todayAttendance.checkIn).format('HH:mm') :
                    '--:--'
                  }
                </Text>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <LogoutOutlined className="text-red-500" />
                  <span className="text-sm font-medium">Check Out</span>
                </div>
                <Text strong>
                  {todayAttendance?.checkOut ?
                    dayjs(todayAttendance.checkOut).format('HH:mm') :
                    '--:--'
                  }
                </Text>
              </div>

              {todayAttendance?.workingHours && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <ClockCircleOutlined className="text-blue-500" />
                    <span className="text-sm font-medium">Working Hours</span>
                  </div>
                  <Text strong className="text-blue-600">
                    {todayAttendance.workingHours.toFixed(1)}h
                  </Text>
                </div>
              )}
            </div>
          </Col>

          <Col xs={24} sm={12}>
            <div className="space-y-3">
              <div className="text-center">
                <Title level={2} className="!mb-1">
                  {currentTime}
                </Title>
                <Text type="secondary">
                  {dayjs().format('dddd, MMMM D, YYYY')}
                </Text>
              </div>

              <Space className="w-full" direction="vertical">
                {canCheckIn && (
                  <Button
                    type="primary"
                    size="large"
                    icon={<LoginOutlined />}
                    onClick={handleCheckIn}
                    loading={checkInMutation.isPending}
                    className="w-full h-12 text-lg font-semibold bg-green-500 hover:bg-green-600"
                  >
                    Check In Now
                  </Button>
                )}

                {canCheckOut && (
                  <Button
                    type="primary"
                    size="large"
                    icon={<LogoutOutlined />}
                    onClick={handleCheckOut}
                    loading={checkOutMutation.isPending}
                    className="w-full h-12 text-lg font-semibold bg-red-500 hover:bg-red-600"
                  >
                    Check Out Now
                  </Button>
                )}

                {!isWorkHours && (
                  <div className="text-center p-3 bg-gray-100 rounded-lg">
                    <Text type="secondary">
                      {dayjs().hour() < 6 ? 'Too early to check in' : 'Outside work hours'}
                    </Text>
                  </div>
                )}

                {todayAttendance?.isLate && (
                  <div className="text-center p-2 bg-orange-50 border border-orange-200 rounded">
                    <Text type="warning" className="text-sm">
                      <ExclamationCircleOutlined /> Late by {todayAttendance.lateMinutes} minutes
                    </Text>
                  </div>
                )}
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Monthly Summary */}
      <Card
        title={
          <div className="flex items-center space-x-2">
            <CalendarOutlined className="text-purple-500" />
            <span>Monthly Summary - {dayjs().format('MMMM YYYY')}</span>
          </div>
        }
        className="mb-4"
        loading={summaryLoading}
      >
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8}>
            <Statistic
              title="Attendance Rate"
              value={monthlySummary?.attendancePercentage || 0}
              precision={1}
              suffix="%"
              prefix={<TrophyOutlined className="text-yellow-500" />}
              valueStyle={{ color: monthlySummary?.attendancePercentage >= 95 ? '#52c41a' : '#faad14' }}
            />
          </Col>
          <Col xs={12} sm={8}>
            <Statistic
              title="Present Days"
              value={monthlySummary?.presentDays || 0}
              prefix={<CheckCircleOutlined className="text-green-500" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={12} sm={8}>
            <Statistic
              title="Late Days"
              value={monthlySummary?.lateDays || 0}
              prefix={<ExclamationCircleOutlined className="text-orange-500" />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>
          <Col xs={12} sm={8}>
            <Statistic
              title="Total Hours"
              value={monthlySummary?.totalWorkingHours || 0}
              precision={1}
              suffix="h"
              prefix={<ClockCircleOutlined className="text-blue-500" />}
            />
          </Col>
          <Col xs={12} sm={8}>
            <Statistic
              title="Overtime"
              value={monthlySummary?.totalOvertimeHours || 0}
              precision={1}
              suffix="h"
              prefix={<FireOutlined className="text-red-500" />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Col>
          <Col xs={12} sm={8}>
            <Statistic
              title="Absent Days"
              value={monthlySummary?.absentDays || 0}
              prefix={<ExclamationCircleOutlined className="text-red-500" />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Col>
        </Row>
      </Card>

      {/* Recent Attendance Records */}
      <Card
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HistoryOutlined className="text-blue-500" />
              <span>Recent Attendance</span>
            </div>
            <Button type="link" href={createLocalizedPath(locale, '/employee/attendance')}>
              View All
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {recentRecords?.slice(0, 5).map((record: AttendanceRecord) => (
            <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                {getStatusIcon(record)}
                <div>
                  <Text strong>{dayjs(record.date).format('ddd, MMM D')}</Text>
                  <br />
                  <Text type="secondary" className="text-sm">
                    {record.checkIn ? dayjs(record.checkIn).format('HH:mm') : '--:--'} -
                    {record.checkOut ? dayjs(record.checkOut).format('HH:mm') : '--:--'}
                    {record.workingHours && ` (${record.workingHours.toFixed(1)}h)`}
                  </Text>
                </div>
              </div>
              <Badge color={getStatusColor(record.status)} text={record.status.replace('_', ' ')} />
            </div>
          ))}
        </div>
      </Card>

      {/* Correction Request Modal */}
      <Modal
        title="Request Attendance Correction"
        open={correctionModalVisible}
        onCancel={() => setCorrectionModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={correctionForm}
          layout="vertical"
          onFinish={handleCorrectionRequest}
        >
          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: 'Please select the date' }]}
            initialValue={dayjs()}
          >
            <input type="date" className="w-full p-2 border rounded" aria-label="Date" />
          </Form.Item>

          <Form.Item
            name="requestType"
            label="Correction Type"
            rules={[{ required: true, message: 'Please select correction type' }]}
          >
            <select className="w-full p-2 border rounded" aria-label="Correction Type">
              <option value="check_in">Check In Time</option>
              <option value="check_out">Check Out Time</option>
              <option value="both">Both Check In and Check Out</option>
              <option value="missing">Missing Attendance</option>
            </select>
          </Form.Item>

          <Form.Item name="checkIn" label="Requested Check In Time">
            <input type="time" className="w-full p-2 border rounded" aria-label="Requested Check In Time" />
          </Form.Item>

          <Form.Item name="checkOut" label="Requested Check Out Time">
            <input type="time" className="w-full p-2 border rounded" aria-label="Requested Check Out Time" />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Reason for Correction"
            rules={[{ required: true, message: 'Please provide a reason' }]}
          >
            <textarea
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Please explain why you need this correction..."
              aria-label="Reason for Correction"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={correctionMutation.isPending}
              >
                Submit Request
              </Button>
              <Button onClick={() => setCorrectionModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
