'use client'

import { useState, useEffect } from 'react'
import { 
  Card, 
  Table, 
  Tag, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  message,
  Tabs
} from 'antd'
import { 
  ClockCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  FileExcelOutlined
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
  userId: number
  date: string
  checkIn: string | null
  checkOut: string | null
  workingHours: number
  status: string
  isLate: boolean
  lateMinutes: number
  overtimeMinutes: number
  notes: string | null
  user: {
    id: number
    fullName: string
    employeeCode: string
    departmentId: number
    department: string
  }
}

interface AttendanceSummary {
  id: number
  userId: number
  month: number
  year: number
  totalWorkingDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  leaveDays: number
  totalWorkingHours: number
  attendancePercentage: number
  user: {
    id: number
    fullName: string
    employeeCode: string
    department: string
  }
}

export default function AdminAttendancePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [attendanceSummaries, setAttendanceSummaries] = useState<AttendanceSummary[]>([])
  const [manualEntryModalVisible, setManualEntryModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ])
  const [summaryMonth, setSummaryMonth] = useState(dayjs().month() + 1)
  const [summaryYear, setSummaryYear] = useState(dayjs().year())
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()

  useEffect(() => {
    fetchAttendanceRecords()
  }, [dateRange])

  useEffect(() => {
    fetchAttendanceSummaries()
  }, [summaryMonth, summaryYear])

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getAllAttendance({
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD')
      })
      setAttendanceRecords(response.attendance || [])
    } catch (error: any) {
      message.error('Failed to fetch attendance records')
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendanceSummaries = async () => {
    try {
      setSummaryLoading(true)
      const response = await apiClient.getAllAttendanceSummaries({
        month: summaryMonth,
        year: summaryYear
      })
      setAttendanceSummaries(response.summaries || [])
    } catch (error: any) {
      message.error('Failed to fetch attendance summaries')
    } finally {
      setSummaryLoading(false)
    }
  }

  const handleCreateManualEntry = async (values: any) => {
    try {
      await apiClient.createManualAttendance({
        userId: values.userId,
        date: values.date.format('YYYY-MM-DD'),
        checkIn: values.checkIn?.format('YYYY-MM-DD HH:mm:ss'),
        checkOut: values.checkOut?.format('YYYY-MM-DD HH:mm:ss'),
        status: values.status,
        notes: values.notes
      })
      
      message.success('Manual attendance entry created successfully!')
      setManualEntryModalVisible(false)
      form.resetFields()
      fetchAttendanceRecords()
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to create attendance entry')
    }
  }

  const handleEditAttendance = (record: AttendanceRecord) => {
    setSelectedRecord(record)
    editForm.setFieldsValue({
      checkIn: record.checkIn ? dayjs(record.checkIn) : null,
      checkOut: record.checkOut ? dayjs(record.checkOut) : null,
      status: record.status,
      notes: record.notes
    })
    setEditModalVisible(true)
  }

  const handleUpdateAttendance = async (values: any) => {
    if (!selectedRecord) return

    try {
      await apiClient.updateAttendance(selectedRecord.id, {
        checkIn: values.checkIn?.format('YYYY-MM-DD HH:mm:ss'),
        checkOut: values.checkOut?.format('YYYY-MM-DD HH:mm:ss'),
        status: values.status,
        notes: values.notes
      })
      
      message.success('Attendance record updated successfully!')
      setEditModalVisible(false)
      editForm.resetFields()
      fetchAttendanceRecords()
    } catch (error: any) {
      message.error('Failed to update attendance record')
    }
  }

  const handleDeleteAttendance = (id: number) => {
    Modal.confirm({
      title: 'Delete Attendance Record',
      content: 'Are you sure you want to delete this attendance record?',
      okText: 'Yes, Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiClient.deleteAttendance(id)
          message.success('Attendance record deleted successfully!')
          fetchAttendanceRecords()
        } catch (error: any) {
          message.error('Failed to delete attendance record')
        }
      }
    })
  }

  const handleGenerateSummaries = async () => {
    Modal.confirm({
      title: 'Generate Monthly Summaries',
      content: `Generate attendance summaries for ${dayjs().month(summaryMonth - 1).format('MMMM')} ${summaryYear}?`,
      onOk: async () => {
        try {
          await apiClient.generateMonthlySummaries({
            month: summaryMonth,
            year: summaryYear
          })
          message.success('Monthly summaries generated successfully!')
          fetchAttendanceSummaries()
        } catch (error: any) {
          message.error('Failed to generate summaries')
        }
      }
    })
  }

  const getStatusTag = (status: string, isLate: boolean, lateMinutes: number) => {
    if (isLate) {
      return <Tag color="warning" icon={<WarningOutlined />}>Late ({lateMinutes}m)</Tag>
    }
    switch (status) {
      case 'present':
        return <Tag color="success" icon={<CheckCircleOutlined />}>Present</Tag>
      case 'absent':
        return <Tag color="error" icon={<CloseCircleOutlined />}>Absent</Tag>
      case 'on_leave':
        return <Tag color="blue">On Leave</Tag>
      case 'half_day':
        return <Tag color="orange">Half Day</Tag>
      default:
        return <Tag>{status}</Tag>
    }
  }

  const attendanceColumns: ColumnsType<AttendanceRecord> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('MMM DD, YYYY')
    },
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.user.fullName}</div>
          <div className="text-gray-500 text-sm">{record.user.employeeCode}</div>
        </div>
      )
    },
    {
      title: 'Department',
      dataIndex: ['user', 'department'],
      key: 'department'
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
      title: 'Hours',
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
      render: (_, record) => getStatusTag(record.status, record.isLate, record.lateMinutes)
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditAttendance(record)}
          >
            Edit
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteAttendance(record.id)}
          >
            Delete
          </Button>
        </Space>
      )
    }
  ]

  const summaryColumns: ColumnsType<AttendanceSummary> = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.user.fullName}</div>
          <div className="text-gray-500 text-sm">{record.user.employeeCode}</div>
        </div>
      )
    },
    {
      title: 'Department',
      dataIndex: ['user', 'department'],
      key: 'department'
    },
    {
      title: 'Working Days',
      dataIndex: 'totalWorkingDays',
      key: 'totalWorkingDays'
    },
    {
      title: 'Present',
      dataIndex: 'presentDays',
      key: 'presentDays',
      render: (days) => <Tag color="success">{days}</Tag>
    },
    {
      title: 'Absent',
      dataIndex: 'absentDays',
      key: 'absentDays',
      render: (days) => <Tag color="error">{days}</Tag>
    },
    {
      title: 'Late',
      dataIndex: 'lateDays',
      key: 'lateDays',
      render: (days) => <Tag color="warning">{days}</Tag>
    },
    {
      title: 'Leave',
      dataIndex: 'leaveDays',
      key: 'leaveDays',
      render: (days) => <Tag color="blue">{days}</Tag>
    },
    {
      title: 'Total Hours',
      dataIndex: 'totalWorkingHours',
      key: 'totalWorkingHours',
      render: (minutes) => `${Math.floor(minutes / 60)}h`
    },
    {
      title: 'Attendance %',
      dataIndex: 'attendancePercentage',
      key: 'attendancePercentage',
      render: (percentage) => (
        <Tag color={percentage >= 90 ? 'success' : percentage >= 75 ? 'warning' : 'error'}>
          {percentage}%
        </Tag>
      )
    }
  ]

  const totalStats = {
    totalRecords: attendanceRecords.length,
    present: attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length,
    absent: attendanceRecords.filter(r => r.status === 'absent').length,
    late: attendanceRecords.filter(r => r.isLate).length
  }

  return (
    <DashboardLayout role={user?.role || 'ROLE_ADMIN'}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">
          <ClockCircleOutlined /> Attendance Management
        </h1>

      <Tabs 
        defaultActiveKey="records"
        items={[
          {
            key: 'records',
            label: 'Attendance Records',
            children: (
              <>
          {/* Statistics */}
          <Row gutter={16} className="mb-6">
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Records"
                  value={totalStats.totalRecords}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Present"
                  value={totalStats.present}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Absent"
                  value={totalStats.absent}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<CloseCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Late"
                  value={totalStats.late}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<WarningOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Card
            title="All Attendance Records"
            extra={
              <Space>
                <RangePicker
                  value={dateRange}
                  onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
                  format="YYYY-MM-DD"
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setManualEntryModalVisible(true)}
                >
                  Manual Entry
                </Button>
              </Space>
            }
          >
            <Table
              columns={attendanceColumns}
              dataSource={attendanceRecords}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 15,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} records`
              }}
            />
          </Card>
              </>
            )
          },
          {
            key: 'summaries',
            label: 'Monthly Summaries',
            children: (
              <>
          <Card
            title="Monthly Attendance Summaries"
            extra={
              <Space>
                <Select
                  value={summaryMonth}
                  onChange={setSummaryMonth}
                  style={{ width: 150 }}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <Select.Option key={i + 1} value={i + 1}>
                      {dayjs().month(i).format('MMMM')}
                    </Select.Option>
                  ))}
                </Select>
                <Select
                  value={summaryYear}
                  onChange={setSummaryYear}
                  style={{ width: 100 }}
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = dayjs().year() - i
                    return (
                      <Select.Option key={year} value={year}>
                        {year}
                      </Select.Option>
                    )
                  })}
                </Select>
                <Button
                  type="primary"
                  icon={<FileExcelOutlined />}
                  onClick={handleGenerateSummaries}
                >
                  Generate Summaries
                </Button>
              </Space>
            }
          >
            <Table
              columns={summaryColumns}
              dataSource={attendanceSummaries}
              rowKey="id"
              loading={summaryLoading}
              pagination={{
                pageSize: 15,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} employees`
              }}
            />
          </Card>
              </>
            )
          }
        ]}
      />

      {/* Manual Entry Modal */}
      <Modal
        title="Create Manual Attendance Entry"
        open={manualEntryModalVisible}
        onCancel={() => {
          setManualEntryModalVisible(false)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateManualEntry}
        >
          <Form.Item
            name="userId"
            label="Employee ID"
            rules={[{ required: true, message: 'Please enter employee ID' }]}
          >
            <Input type="number" placeholder="Enter employee user ID" />
          </Form.Item>

          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: 'Please select date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="checkIn"
            label="Check In Time"
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="checkOut"
            label="Check Out Time"
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            initialValue="present"
          >
            <Select>
              <Select.Option value="present">Present</Select.Option>
              <Select.Option value="absent">Absent</Select.Option>
              <Select.Option value="late">Late</Select.Option>
              <Select.Option value="half_day">Half Day</Select.Option>
              <Select.Option value="on_leave">On Leave</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <TextArea rows={3} placeholder="Optional notes..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Attendance Record"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false)
          editForm.resetFields()
        }}
        onOk={() => editForm.submit()}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateAttendance}
        >
          <Form.Item
            name="checkIn"
            label="Check In Time"
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="checkOut"
            label="Check Out Time"
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
          >
            <Select>
              <Select.Option value="present">Present</Select.Option>
              <Select.Option value="absent">Absent</Select.Option>
              <Select.Option value="late">Late</Select.Option>
              <Select.Option value="half_day">Half Day</Select.Option>
              <Select.Option value="on_leave">On Leave</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <TextArea rows={3} placeholder="Optional notes..." />
          </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}