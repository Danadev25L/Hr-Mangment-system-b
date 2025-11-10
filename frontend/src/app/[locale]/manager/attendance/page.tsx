'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, Table, Tag, DatePicker, Row, Col, Statistic, Space, Select, Button, message, Tabs } from 'antd'
import { 
  TeamOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  WarningOutlined,
  UserOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import apiClient from '@/lib/api'
import dayjs, { Dayjs } from 'dayjs'
import type { ColumnsType } from 'antd/es/table'

const { RangePicker } = DatePicker

interface TeamAttendance {
  id: number
  userId: number
  date: string
  checkIn: string | null
  checkOut: string | null
  workingHours: number
  status: string
  isLate: boolean
  lateMinutes: number
  holidayName?: string
  user: {
    id: number
    fullName: string
    employeeCode: string
    jobTitle: string
  }
}

interface TodayStats {
  totalTeamMembers: number
  present: number
  absent: number
  late: number
  checkedOut: number
  onHoliday?: number
  isHoliday?: boolean
  holidayName?: string
}

export default function ManagerTeamAttendancePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [todayLoading, setTodayLoading] = useState(false)
  const [teamAttendance, setTeamAttendance] = useState<TeamAttendance[]>([])
  const [todayAttendance, setTodayAttendance] = useState<TeamAttendance[]>([])
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [selectedTodayRowKeys, setSelectedTodayRowKeys] = useState<React.Key[]>([])
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ])

  const fetchTeamAttendance = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiClient.getTeamAttendance({
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD')
      })
      setTeamAttendance(response.attendance || [])
    } catch (error: any) {
      message.error('Failed to fetch team attendance')
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  const fetchTodayTeamAttendance = useCallback(async () => {
    try {
      setTodayLoading(true)
      const response = await apiClient.getTodayTeamAttendance()
      setTodayAttendance(response.attendance || [])
      setTodayStats(response.stats || null)
    } catch (error: any) {
      message.error('Failed to fetch today\'s team attendance')
    } finally {
      setTodayLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTodayTeamAttendance()
    fetchTeamAttendance()
  }, [fetchTeamAttendance, fetchTodayTeamAttendance])

  useEffect(() => {
    fetchTeamAttendance()
  }, [dateRange, fetchTeamAttendance])

  const getStatusTag = (status: string, isLate: boolean, lateMinutes: number, holidayName?: string) => {
    if (status === 'holiday') {
      return <Tag color="purple" icon={<CalendarOutlined />}>Holiday{holidayName ? ` - ${holidayName}` : ''}</Tag>
    }
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

  // Row selection for today's attendance
  const todayRowSelection = {
    selectedRowKeys: selectedTodayRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedTodayRowKeys(selectedKeys)
    },
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
  }

  // Row selection for attendance history
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

  const handleBulkAction = () => {
    if (selectedRowKeys.length === 0 && selectedTodayRowKeys.length === 0) {
      message.warning('Please select at least one record')
      return
    }
    message.info(`Selected ${selectedRowKeys.length || selectedTodayRowKeys.length} record(s)`)
  }

  const clearSelection = () => {
    setSelectedRowKeys([])
    setSelectedTodayRowKeys([])
    message.success('Selection cleared')
  }

  const todayColumns: ColumnsType<TeamAttendance> = [
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
      title: 'Job Title',
      dataIndex: ['user', 'jobTitle'],
      key: 'jobTitle'
    },
    {
      title: 'Check In',
      dataIndex: 'checkIn',
      key: 'checkIn',
      render: (checkIn, record) => {
        if (record.status === 'holiday') return <Tag color="purple">Holiday</Tag>
        return checkIn ? dayjs(checkIn).format('hh:mm A') : '-'
      }
    },
    {
      title: 'Check Out',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (checkOut, record) => {
        if (record.status === 'holiday') return <Tag color="purple">Holiday</Tag>
        return checkOut ? dayjs(checkOut).format('hh:mm A') : '-'
      }
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => getStatusTag(record.status, record.isLate, record.lateMinutes, record.holidayName)
    }
  ]

  const columns: ColumnsType<TeamAttendance> = [
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
      title: 'Check In',
      dataIndex: 'checkIn',
      key: 'checkIn',
      render: (checkIn, record) => {
        if (record.status === 'holiday') return <Tag color="purple">Holiday</Tag>
        return checkIn ? dayjs(checkIn).format('hh:mm A') : '-'
      }
    },
    {
      title: 'Check Out',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (checkOut, record) => {
        if (record.status === 'holiday') return <Tag color="purple">Holiday</Tag>
        return checkOut ? dayjs(checkOut).format('hh:mm A') : '-'
      }
    },
    {
      title: 'Working Hours',
      dataIndex: 'workingHours',
      key: 'workingHours',
      render: (minutes, record) => {
        if (record.status === 'holiday') return '-'
        if (!minutes) return '-'
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return `${hours}h ${mins}m`
      }
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => getStatusTag(record.status, record.isLate, record.lateMinutes, record.holidayName)
    }
  ]

  return (
    <DashboardLayout role={user?.role || 'ROLE_MANAGER'}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">
          <TeamOutlined /> Team Attendance
        </h1>
        
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Managers can view team attendance records. All attendance actions (check-in, check-out, edits, and approvals) are handled by administrators only.
          </p>
        </div>

      <Tabs 
        defaultActiveKey="today"
        items={[
          {
            key: 'today',
            label: "Today's Status",
            children: (
              <>
          {/* Today's Statistics */}
          {todayStats && (
            <>
              {todayStats.isHoliday && (
                <div className="mb-4 p-4 bg-purple-50 border border-purple-300 rounded">
                  <p className="text-lg font-semibold text-purple-800">
                    <CalendarOutlined className="mr-2" />
                    Today is a Public Holiday: {todayStats.holidayName}
                  </p>
                  <p className="text-sm text-purple-700 mt-1">
                    All {todayStats.totalTeamMembers} team members are marked as on holiday.
                  </p>
                </div>
              )}
            <Row gutter={16} className="mb-6">
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Total Team Members"
                    value={todayStats.totalTeamMembers}
                    prefix={<UserOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title={todayStats.isHoliday ? "On Holiday" : "Present"}
                    value={todayStats.isHoliday ? todayStats.onHoliday : todayStats.present}
                    valueStyle={{ color: todayStats.isHoliday ? '#722ed1' : '#3f8600' }}
                    prefix={todayStats.isHoliday ? <CalendarOutlined /> : <CheckCircleOutlined />}
                    suffix={`/ ${todayStats.totalTeamMembers}`}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Absent"
                    value={todayStats.absent}
                    valueStyle={{ color: '#cf1322' }}
                    prefix={<CloseCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Late Arrivals"
                    value={todayStats.late}
                    valueStyle={{ color: '#faad14' }}
                    prefix={<WarningOutlined />}
                  />
                </Card>
              </Col>
            </Row>
            </>
          )}

          {/* Today's Attendance Table */}
          <Card 
            title={`Today - ${dayjs().format('MMMM DD, YYYY')}`}
            extra={
              selectedTodayRowKeys.length > 0 && (
                <Space>
                  <Button onClick={clearSelection} size="small">
                    Clear Selection
                  </Button>
                  <span className="text-sm text-gray-600">
                    {selectedTodayRowKeys.length} selected
                  </span>
                </Space>
              )
            }
          >
            <Table
              columns={todayColumns}
              dataSource={todayAttendance}
              rowKey="id"
              loading={todayLoading}
              pagination={false}
              rowSelection={todayRowSelection}
            />
          </Card>
              </>
            )
          },
          {
            key: 'history',
            label: 'Attendance History',
            children: (
              <>
          <Card
            title="Team Attendance Records"
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
              </Space>
            }
          >
            <Table
              columns={columns}
              dataSource={teamAttendance}
              rowKey={(record) => `${record.id}-${record.userId}`}
              loading={loading}
              rowSelection={rowSelection}
              pagination={{
                pageSize: 15,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} records`
              }}
            />
          </Card>
              </>
            )
          }
        ]}
      />
      </div>
    </DashboardLayout>
  )
}
