'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Table, Tag, DatePicker, Statistic, Row, Col, Space, Modal, Form, Input, Select, message, Spin } from 'antd'
import { 
  ClockCircleOutlined, 
  LoginOutlined, 
  LogoutOutlined, 
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  EditOutlined
} from '@ant-design/icons'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import apiClient from '@/lib/api'
import dayjs, { Dayjs } from 'dayjs'
import type { ColumnsType } from 'antd/es/table'

const { RangePicker } = DatePicker
const { TextArea } = Input

interface AttendanceRecord {
  id: number
  date: string
  checkIn: string | null
  checkOut: string | null
  workingHours: number
  status: string
  isLate: boolean
  lateMinutes: number
  overtimeMinutes: number
  notes: string | null
}

interface TodayAttendance {
  id?: number
  checkIn: string | null
  checkOut: string | null
  hasCheckedIn: boolean
  hasCheckedOut: boolean
  status?: string
  isLate?: boolean
  lateMinutes?: number
}

export default function EmployeeAttendancePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ])
  const [correctionModalVisible, setCorrectionModalVisible] = useState(false)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [checkOutLoading, setCheckOutLoading] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchTodayAttendance()
    fetchAttendanceRecords()
  }, [])

  useEffect(() => {
    fetchAttendanceRecords()
  }, [dateRange])

  const fetchTodayAttendance = async () => {
    try {
      const response = await apiClient.getTodayAttendance()
      setTodayAttendance(response.attendance || { 
        checkIn: null, 
        checkOut: null, 
        hasCheckedIn: false, 
        hasCheckedOut: false 
      })
    } catch (error: any) {
      console.error('Error fetching today attendance:', error)
    }
  }

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getMyAttendance({
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD')
      })
      setAttendanceRecords(response.attendance || [])
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch attendance records')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    try {
      setCheckInLoading(true)
      const deviceInfo = `${navigator.platform} - ${navigator.userAgent.split(' ')[0]}`
      
      const response = await apiClient.checkIn({
        location: 'Office',
        deviceInfo,
        notes: ''
      })
      
      message.success(response.message || 'Checked in successfully!')
      await fetchTodayAttendance()
      await fetchAttendanceRecords()
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to check in')
    } finally {
      setCheckInLoading(false)
    }
  }

  const handleCheckOut = async () => {
    try {
      setCheckOutLoading(true)
      const response = await apiClient.checkOut({})
      
      message.success(response.message || 'Checked out successfully!')
      await fetchTodayAttendance()
      await fetchAttendanceRecords()
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to check out')
    } finally {
      setCheckOutLoading(false)
    }
  }

  const handleRequestCorrection = async (values: any) => {
    try {
      await apiClient.requestAttendanceCorrection({
        date: values.date.format('YYYY-MM-DD'),
        requestType: values.requestType,
        requestedCheckIn: values.requestedCheckIn?.format('YYYY-MM-DD HH:mm:ss'),
        requestedCheckOut: values.requestedCheckOut?.format('YYYY-MM-DD HH:mm:ss'),
        reason: values.reason
      })
      
      message.success('Correction request submitted successfully!')
      setCorrectionModalVisible(false)
      form.resetFields()
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to submit correction request')
    }
  }

  const getStatusTag = (record: AttendanceRecord) => {
    switch (record.status) {
      case 'present':
        return <Tag color="success" icon={<CheckCircleOutlined />}>Present</Tag>
      case 'late':
        return <Tag color="warning" icon={<WarningOutlined />}>Late ({record.lateMinutes}m)</Tag>
      case 'absent':
        return <Tag color="error" icon={<CloseCircleOutlined />}>Absent</Tag>
      case 'half_day':
        return <Tag color="orange">Half Day</Tag>
      case 'on_leave':
        return <Tag color="blue">On Leave</Tag>
      default:
        return <Tag>{record.status}</Tag>
    }
  }

  const columns: ColumnsType<AttendanceRecord> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('MMMM DD, YYYY (ddd)')
    },
    {
      title: 'Check In',
      dataIndex: 'checkIn',
      key: 'checkIn',
      render: (checkIn) => checkIn ? dayjs(checkIn).format('hh:mm A') : '-'
    },
    {
      title: 'Check Out',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (checkOut) => checkOut ? dayjs(checkOut).format('hh:mm A') : '-'
    },
    {
      title: 'Working Hours',
      dataIndex: 'workingHours',
      key: 'workingHours',
      render: (minutes) => {
        if (!minutes) return '-'
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return `${hours}h ${mins}m`
      }
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => getStatusTag(record)
    },
    {
      title: 'Overtime',
      dataIndex: 'overtimeMinutes',
      key: 'overtimeMinutes',
      render: (minutes) => minutes > 0 ? `${minutes}m` : '-'
    }
  ]

  const stats = {
    present: attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length,
    absent: attendanceRecords.filter(r => r.status === 'absent').length,
    late: attendanceRecords.filter(r => r.isLate).length,
    totalHours: Math.floor(attendanceRecords.reduce((sum, r) => sum + (r.workingHours || 0), 0) / 60)
  ]

  return (
    <DashboardLayout role={user?.role || 'ROLE_EMPLOYEE'}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">
          <ClockCircleOutlined /> My Attendance
        </h1>

      {/* Today's Status Card */}
      <Card 
        title={
          <Space>
            <CalendarOutlined />
            <span>Today - {dayjs().format('MMMM DD, YYYY')}</span>
          </Space>
        }
        style={{ marginBottom: '24px' }}
        extra={
          <Space>
            {!todayAttendance?.hasCheckedIn && (
              <Button 
                type="primary" 
                icon={<LoginOutlined />}
                onClick={handleCheckIn}
                loading={checkInLoading}
                size="large"
              >
                Check In
              </Button>
            )}
            {todayAttendance?.hasCheckedIn && !todayAttendance?.hasCheckedOut && (
              <Button 
                type="primary"
                danger
                icon={<LogoutOutlined />}
                onClick={handleCheckOut}
                loading={checkOutLoading}
                size="large"
              >
                Check Out
              </Button>
            )}
          </Space>
        }
      >
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Check In Time"
              value={todayAttendance?.checkIn ? dayjs(todayAttendance.checkIn).format('hh:mm A') : '-'}
              prefix={<LoginOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Check Out Time"
              value={todayAttendance?.checkOut ? dayjs(todayAttendance.checkOut).format('hh:mm A') : '-'}
              prefix={<LogoutOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Status"
              value={todayAttendance?.status || 'Not Checked In'}
              valueStyle={{ 
                color: todayAttendance?.isLate ? '#faad14' : '#3f8600' 
              }}
            />
          </Col>
          <Col span={6}>
            {todayAttendance?.isLate && (
              <Statistic
                title="Late By"
                value={`${todayAttendance.lateMinutes} mins`}
                valueStyle={{ color: '#cf1322' }}
                prefix={<WarningOutlined />}
              />
            )}
          </Col>
        </Row>
      </Card>

      {/* Monthly Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Present Days"
              value={stats.present}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Absent Days"
              value={stats.absent}
              valueStyle={{ color: '#cf1322' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Late Days"
              value={stats.late}
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Hours"
              value={stats.totalHours}
              suffix="hrs"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Attendance Records Table */}
      <Card
        title="Attendance Records"
        extra={
          <Space>
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
              format="YYYY-MM-DD"
            />
            <Button 
              icon={<EditOutlined />}
              onClick={() => setCorrectionModalVisible(true)}
            >
              Request Correction
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={attendanceRecords}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} records`
          }}
        />
      </Card>

      {/* Correction Request Modal */}
      <Modal
        title="Request Attendance Correction"
        open={correctionModalVisible}
        onCancel={() => {
          setCorrectionModalVisible(false)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleRequestCorrection}
        >
          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: 'Please select date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="requestType"
            label="Request Type"
            rules={[{ required: true, message: 'Please select request type' }]}
          >
            <Select placeholder="Select request type">
              <Select.Option value="missed_checkin">Missed Check-in</Select.Option>
              <Select.Option value="missed_checkout">Missed Check-out</Select.Option>
              <Select.Option value="wrong_time">Wrong Time</Select.Option>
              <Select.Option value="forgot_punch">Forgot to Punch</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="requestedCheckIn"
            label="Requested Check-in Time"
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="requestedCheckOut"
            label="Requested Check-out Time"
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Reason"
            rules={[{ required: true, message: 'Please provide reason' }]}
          >
            <TextArea rows={4} placeholder="Explain why you need this correction..." />
          </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}