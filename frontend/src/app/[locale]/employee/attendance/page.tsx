'use client'

import { useState, useEffect, useCallback } from 'react'
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
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ])
  const [correctionModalVisible, setCorrectionModalVisible] = useState(false)
  const [form] = Form.useForm()

  const fetchAttendanceRecords = useCallback(async () => {
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
  }, [dateRange])

  const fetchTodayAttendance = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    fetchTodayAttendance()
    fetchAttendanceRecords()
  }, [fetchAttendanceRecords, fetchTodayAttendance])

  useEffect(() => {
    fetchAttendanceRecords()
  }, [dateRange, fetchAttendanceRecords])

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
  }

  // Row selection configuration
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys)
    },
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
  }

  const clearSelection = () => {
    setSelectedRowKeys([])
    message.success('Selection cleared')
  }

  return (
    <DashboardLayout role={user?.role || 'ROLE_EMPLOYEE'}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">
          <ClockCircleOutlined /> My Attendance
        </h1>
        
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Attendance is managed by administrators. Check-in and check-out actions are handled by admin staff. You can view your attendance records and request corrections if needed.
          </p>
        </div>

      {/* Today's Status Card */}
      <Card 
        title={
          <Space>
            <CalendarOutlined />
            <span>Today - {dayjs().format('MMMM DD, YYYY')}</span>
          </Space>
        }
        style={{ marginBottom: '24px' }}
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
            {selectedRowKeys.length > 0 && (
              <>
                <Button onClick={clearSelection} size="small">
                  Clear Selection
                </Button>
                <span className="text-sm text-gray-600">
                  {selectedRowKeys.length} selected
                </span>
              </>
            )}
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
          rowSelection={rowSelection}
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