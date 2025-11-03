'use client'

import { useState, useEffect } from 'react'
import { Card, Table, Tag, DatePicker, Row, Col, Statistic, Space, Select, Button, message, Tabs } from 'antd'
import { 
  TeamOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  WarningOutlined,
  UserOutlined
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
}

export default function ManagerTeamAttendancePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [todayLoading, setTodayLoading] = useState(false)
  const [teamAttendance, setTeamAttendance] = useState<TeamAttendance[]>([])
  const [todayAttendance, setTodayAttendance] = useState<TeamAttendance[]>([])
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ])

  useEffect(() => {
    fetchTodayTeamAttendance()
    fetchTeamAttendance()
  }, [])

  useEffect(() => {
    fetchTeamAttendance()
  }, [dateRange])

  const fetchTodayTeamAttendance = async () => {
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
  }

  const fetchTeamAttendance = async () => {
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
      render: (checkIn) => checkIn ? dayjs(checkIn).format('hh:mm A') : '-'
    },
    {
      title: 'Check Out',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (checkOut) => checkOut ? dayjs(checkOut).format('hh:mm A') : '-'
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => getStatusTag(record.status, record.isLate, record.lateMinutes)
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
      render: (_, record) => getStatusTag(record.status, record.isLate, record.lateMinutes)
    }
  ]

  return (
    <DashboardLayout role={user?.role || 'ROLE_MANAGER'}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">
          <TeamOutlined /> Team Attendance
        </h1>

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
                    title="Present"
                    value={todayStats.present}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<CheckCircleOutlined />}
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
          )}

          {/* Today's Attendance Table */}
          <Card title={`Today - ${dayjs().format('MMMM DD, YYYY')}`}>
            <Table
              columns={todayColumns}
              dataSource={todayAttendance}
              rowKey="id"
              loading={todayLoading}
              pagination={false}
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
              <RangePicker
                value={dateRange}
                onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
                format="YYYY-MM-DD"
              />
            }
          >
            <Table
              columns={columns}
              dataSource={teamAttendance}
              rowKey={(record) => `${record.id}-${record.userId}`}
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
          }
        ]}
      />
      </div>
    </DashboardLayout>
  )
}
