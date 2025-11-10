'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, Row, Col, Button, Calendar, Badge, Modal, Form, Input, Select, TimePicker, message } from 'antd'
import {
  TeamOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  RightOutlined,
  LineChartOutlined,
  PieChartOutlined,
  BarChartOutlined,
  UserAddOutlined,
  FileAddOutlined,
  DollarOutlined,
  SettingOutlined,
  BellOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useTranslations, useLocale } from 'next-intl'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Pie, Doughnut } from 'react-chartjs-2'
import apiClient from '@/lib/api'
import dayjs from 'dayjs'
import 'dayjs/locale/ar'
import 'dayjs/locale/ku'
import 'dayjs/locale/en'
import { useRouter } from 'next/navigation'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const ManagerDashboard = React.memo(function ManagerDashboard() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const [isEventModalVisible, setIsEventModalVisible] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null)
  const [form] = Form.useForm()

  const { data: stats } = useQuery({
    queryKey: ['manager-dashboard-stats'],
    queryFn: async () => {
      const [users, attendance, applications, calendarEvents] = await Promise.all([
        apiClient.getUsers(1, 100),
        apiClient.getAllEmployeesWithAttendance({ date: dayjs().format('YYYY-MM-DD') }),
        apiClient.getApplications(1, 100, { status: 'pending' }),
        apiClient.getCalendarEvents({
          startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
          endDate: dayjs().endOf('month').format('YYYY-MM-DD')
        })
      ])
      return { users, attendance, applications, calendarEvents }
    }
  })

  const teamSize = stats?.users?.data?.length || 0
  const attendanceData = stats?.attendance?.employees || []
  const pendingApps = stats?.applications?.applications?.filter((a: any) => a.status === 'pending').length || 0
  const calendarEvents = Array.isArray(stats?.calendarEvents?.data) ? stats.calendarEvents.data : []

  const presentToday = attendanceData.filter((a: any) => 
    a.status === 'present' && dayjs(a.date).isSame(dayjs(), 'day')
  ).length
  const attendanceRate = teamSize > 0 ? ((presentToday / teamSize) * 100).toFixed(1) : 0

  // Quick Actions data
  const quickActions = [
    {
      title: t('applications.reviewApplications'),
      icon: <FileTextOutlined className="text-2xl" />,
      bgColor: 'from-blue-500 to-blue-600',
      link: `/${locale}/manager/applications`
    },
    {
      title: t('dashboard.viewTeam'),
      icon: <TeamOutlined className="text-2xl" />,
      bgColor: 'from-green-500 to-green-600',
      link: `/${locale}/manager/employees`
    },
    {
      title: t('attendance.viewAttendance'),
      icon: <ClockCircleOutlined className="text-2xl" />,
      bgColor: 'from-purple-500 to-purple-600',
      link: `/${locale}/manager/attendance`
    },
    {
      title: t('dashboard.viewReportsBtn'),
      icon: <BarChartOutlined className="text-2xl" />,
      bgColor: 'from-orange-500 to-orange-600',
      link: `/${locale}/manager/reports`
    },
    {
      title: t('dashboard.settings'),
      icon: <SettingOutlined className="text-2xl" />,
      bgColor: 'from-indigo-500 to-indigo-600',
      link: `/${locale}/manager/settings`
    },
    {
      title: t('dashboard.announcementsBtn'),
      icon: <BellOutlined className="text-2xl" />,
      bgColor: 'from-pink-500 to-pink-600',
      link: `/${locale}/manager/announcements`
    },
  ]

  // Chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day'))
  const attendanceByDay = last7Days.map(day => {
    const dayRecords = attendanceData.filter((a: any) => dayjs(a.date).isSame(day, 'day') && a.status === 'present')
    return dayRecords.length
  })

  const attendanceTrendData = {
    labels: last7Days.map(d => d.format('MMM DD')),
    datasets: [
      {
        label: t('dashboard.teamAttendance'),
        data: attendanceByDay,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  }

  const todayAttendanceData = {
    labels: [t('attendance.present'), t('attendance.absent'), t('attendance.late')],
    datasets: [
      {
        data: [presentToday, teamSize - presentToday, 0],
        backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
        borderWidth: 0,
      }
    ]
  }

  const applicationsStatusData = {
    labels: [t('applications.pending'), t('applications.approved'), t('applications.rejected')],
    datasets: [
      {
        data: [pendingApps, 15, 5],
        backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
        borderWidth: 0,
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  }

  // Calendar mutations
  const createEventMutation = useMutation({
    mutationFn: (data: any) => apiClient.createCalendarEvent(data),
    onSuccess: () => {
      message.success(t('dashboard.eventCreatedSuccessfully'))
      queryClient.invalidateQueries({ queryKey: ['manager-dashboard-stats'] })
      setIsEventModalVisible(false)
      form.resetFields()
    },
  })

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: any) => apiClient.updateCalendarEvent(id, data),
    onSuccess: () => {
      message.success(t('dashboard.eventUpdatedSuccessfully'))
      queryClient.invalidateQueries({ queryKey: ['manager-dashboard-stats'] })
      setIsEventModalVisible(false)
      setEditingEvent(null)
      form.resetFields()
    },
  })

  const deleteEventMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteCalendarEvent(id),
    onSuccess: () => {
      message.success(t('dashboard.eventDeletedSuccessfully'))
      queryClient.invalidateQueries({ queryKey: ['manager-dashboard-stats'] })
    },
  })

  const handleAddEvent = () => {
    setEditingEvent(null)
    setSelectedDate(dayjs())
    form.resetFields()
    setIsEventModalVisible(true)
  }

  const handleEditEvent = (event: any) => {
    setEditingEvent(event)
    setSelectedDate(dayjs(event.date))
    form.setFieldsValue({
      title: event.title,
      type: event.type,
      time: event.time ? dayjs(event.time, 'HH:mm') : null,
      description: event.description,
    })
    setIsEventModalVisible(true)
  }

  const handleDateSelect = (date: dayjs.Dayjs) => {
    setSelectedDate(date)
    setEditingEvent(null)
    form.resetFields()
    setIsEventModalVisible(true)
  }

  const handleEventSubmit = async () => {
    try {
      const values = await form.validateFields()
      const eventData = {
        title: values.title,
        type: values.type,
        date: selectedDate?.format('YYYY-MM-DD'),
        time: values.time ? values.time.format('HH:mm') : null,
        description: values.description || null,
      }

      if (editingEvent) {
        updateEventMutation.mutate({ id: editingEvent.id, data: eventData })
      } else {
        createEventMutation.mutate(eventData)
      }
    } catch (error) {
      console.error('Form validation failed:', error)
    }
  }

  const handleDeleteEvent = (eventId: number) => {
    Modal.confirm({
      title: t('dashboard.deleteEventTitle'),
      content: t('dashboard.deleteEventContent'),
      okText: t('dashboard.deleteBtn'),
      okType: 'danger',
      onOk: () => deleteEventMutation.mutate(eventId),
    })
  }

  const quickStats = [
    {
      title: t('dashboard.teamSize'),
      value: teamSize,
      icon: <TeamOutlined />,
      color: 'blue',
      trend: '+3',
      isUp: true,
      onClick: () => router.push(`/${locale}/manager/employees`)
    },
    {
      title: t('attendance.todayAttendance'),
      value: `${attendanceRate}%`,
      icon: <ClockCircleOutlined />,
      color: 'green',
      trend: '+5%',
      isUp: true,
      onClick: () => router.push(`/${locale}/manager/attendance`)
    },
    {
      title: t('applications.pendingReview'),
      value: pendingApps,
      icon: <FileTextOutlined />,
      color: 'orange',
      trend: '-2',
      isUp: false,
      onClick: () => router.push(`/${locale}/manager/applications`)
    },
  ]

  const lineChartData = {
    labels: last7Days.map(d => d.format('MMM DD')),
    datasets: [
      {
        label: t('attendance.teamAttendance'),
        data: attendanceByDay,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <span className="text-5xl">👋</span>
            {t('dashboard.manager.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
            {t('dashboard.manager.subtitle')}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {dayjs().locale(locale).format('dddd')}
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {dayjs().locale(locale).format('MMM DD, YYYY')}
          </div>
          <div className="text-lg text-gray-600 dark:text-gray-300">
            {dayjs().locale(locale).format('HH:mm A')}
          </div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card
            hoverable
            onClick={() => router.push(`/${locale}/manager/employees`)}
            className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{teamSize}</div>
                <div className="text-sm text-gray-700 dark:text-gray-400 mt-1">{t('dashboard.teamSize')}</div>
                <div className="text-xs text-gray-600 dark:text-gray-500 mt-1 flex items-center">
                  <CheckCircleOutlined className="mr-1" />
                  {t('dashboard.totalTeamMembers')}
                </div>
              </div>
              <TeamOutlined className="text-5xl text-blue-500 opacity-50" />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card
            hoverable
            onClick={() => router.push(`/${locale}/manager/attendance`)}
            className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold text-green-600 dark:text-green-400">{attendanceRate}%</div>
                <div className="text-sm text-gray-700 dark:text-gray-400 mt-1">{t('attendance.todayAttendance')}</div>
                <div className="text-xs text-gray-600 dark:text-gray-500 mt-1 flex items-center">
                  <CheckCircleOutlined className="mr-1" />
                  {presentToday} {t('dashboard.employeesPresent')}
                </div>
              </div>
              <ClockCircleOutlined className="text-5xl text-green-500 opacity-50" />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card
            hoverable
            onClick={() => router.push(`/${locale}/manager/applications`)}
            className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold text-orange-600 dark:text-orange-400">{pendingApps}</div>
                <div className="text-sm text-gray-700 dark:text-gray-400 mt-1">{t('applications.pendingReview')}</div>
                <div className="text-xs text-gray-600 dark:text-gray-500 mt-1 flex items-center">
                  <FileTextOutlined className="mr-1" />
                  {t('dashboard.requiresAction')}
                </div>
              </div>
              <FileTextOutlined className="text-5xl text-orange-500 opacity-50" />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Calendar Section */}
      <Card
        title={
          <span className="text-2xl font-bold flex items-center text-gray-800 dark:text-gray-100">
            <CalendarOutlined className="mr-3 text-blue-500 dark:text-blue-400" />
            <span className="text-gray-800 dark:text-gray-100">{t('dashboard.calendarSectionTitle')}</span>
          </span>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddEvent}
            className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            {t('dashboard.addEventBtn')}
          </Button>
        }
        className="shadow-lg border-0 bg-white dark:bg-gray-800 transition-colors"
      >
        <div className="manager-calendar">
          <Calendar
            fullscreen={false}
            onSelect={handleDateSelect}
            cellRender={(current, info) => {
              if (info.type !== 'date') return info.originNode
              
              const dateStr = current.format('YYYY-MM-DD')
              const dayEvents = calendarEvents.filter((event: any) => 
                dayjs(event.date).format('YYYY-MM-DD') === dateStr
              )
              
              return (
                <div className="space-y-1">
                  {dayEvents.map((event: any) => (
                    <Badge
                      key={event.id}
                      status={event.type === 'holiday' ? 'success' : 'processing'}
                      text={
                        <span 
                          className="text-xs truncate block font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-500"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditEvent(event)
                          }}
                        >
                          {event.title}
                        </span>
                      }
                    />
                  ))}
                </div>
              )
            }}
          />
        </div>
      </Card>

      {/* Quick Actions */}
      <Card
        title={
          <span className="text-2xl font-bold flex items-center">
            <RightOutlined className="mr-3 text-purple-500" />
            {t('dashboard.quickActions')}
          </span>
        }
        className="shadow-xl border-0 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800"
      >
        <Row gutter={[16, 16]}>
          {quickActions.map((action, index) => (
            <Col xs={12} sm={8} lg={4} key={index}>
              <div
                onClick={() => router.push(action.link)}
                className={`p-6 rounded-xl bg-gradient-to-br ${action.bgColor} text-white cursor-pointer hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl text-center`}
              >
                <div className="mb-3">{action.icon}</div>
                <div className="text-sm font-medium">{action.title}</div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Statistics & Analytics Section */}
      <Card
        title={
          <span className="text-2xl font-bold flex items-center">
            <BarChartOutlined className="mr-3 text-indigo-500" />
            {t('dashboard.statisticsAnalytics')}
          </span>
        }
        className="shadow-xl border-0 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800"
      >
        {/* Team Performance */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300 border-b pb-2">
            📊 {t('dashboard.teamPerformanceSection')}
          </h3>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card
                title={
                  <span className="text-lg font-semibold flex items-center">
                    <LineChartOutlined className="mr-2 text-green-500" />
                    {t('dashboard.teamPerformance')} - Last 7 Days
                  </span>
                }
                extra={
                  <Button type="link" onClick={() => router.push(`/${locale}/manager/attendance`)}>
                    {t('dashboard.attendanceViewAll')}
                  </Button>
                }
                className="shadow-lg border-0"
              >
                <div className="h-[300px]">
                  <Line data={attendanceTrendData} options={chartOptions} />
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                title={
                  <span className="text-lg font-semibold flex items-center">
                    <PieChartOutlined className="mr-2 text-blue-500" />
                    {t('dashboard.todaysAttendance')}
                  </span>
                }
                className="shadow-lg border-0"
              >
                <div className="h-[300px] flex items-center justify-center">
                  <Doughnut data={todayAttendanceData} options={doughnutOptions} />
                </div>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Application Analytics */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300 border-b pb-2">
            📝 {t('dashboard.applicationAnalytics')}
          </h3>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card
                title={
                  <span className="text-lg font-semibold flex items-center">
                    <FileTextOutlined className="mr-2 text-purple-500" />
                    {t('dashboard.applicationsStatus')}
                  </span>
                }
                className="shadow-lg border-0"
              >
                <div className="h-[300px] flex items-center justify-center">
                  <Pie data={applicationsStatusData} options={doughnutOptions} />
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                title={
                  <span className="text-lg font-semibold flex items-center">
                    <CheckCircleOutlined className="mr-2 text-green-500" />
                    {t('dashboard.todaySummary')}
                  </span>
                }
                className="shadow-lg border-0"
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24}>
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl">
                      <CheckCircleOutlined className="text-4xl text-green-600 dark:text-green-400 mb-2" />
                      <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-1">
                        {presentToday}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t('attendance.present')} Today
                      </div>
                    </div>
                  </Col>
                  <Col xs={24}>
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
                      <TeamOutlined className="text-4xl text-blue-600 dark:text-blue-400 mb-2" />
                      <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                        {teamSize}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t('dashboard.totalTeamMembers')}
                      </div>
                    </div>
                  </Col>
                  <Col xs={24}>
                    <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl">
                      <FileTextOutlined className="text-4xl text-orange-600 dark:text-orange-400 mb-2" />
                      <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                        {pendingApps}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t('applications.pendingReview')}
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </div>
      </Card>

      {/* Event Modal */}
      <Modal
        title={
          <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {editingEvent ? t('dashboard.editEventTitle') : t('dashboard.createNewEvent')}
          </span>
        }
        open={isEventModalVisible}
        onOk={handleEventSubmit}
        onCancel={() => {
          setIsEventModalVisible(false)
          setEditingEvent(null)
          form.resetFields()
        }}
        okText={editingEvent ? t('dashboard.updateBtn') : t('dashboard.createBtn')}
        okButtonProps={{
          className: 'bg-blue-500 hover:bg-blue-600',
          loading: createEventMutation.isPending || updateEventMutation.isPending
        }}
        className="dark-mode-modal"
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="title"
            label={t('dashboard.eventTitle')}
            rules={[{ required: true, message: t('dashboard.eventTitleRequired') }]}
          >
            <Input placeholder={t('dashboard.eventTitlePlaceholder')} />
          </Form.Item>

          <Form.Item
            name="type"
            label={t('dashboard.eventType')}
            rules={[{ required: true, message: t('dashboard.eventTypeRequired') }]}
          >
            <Select placeholder={t('dashboard.selectEventType')}>
              <Select.Option value="meeting">{t('dashboard.eventTypeMeeting')}</Select.Option>
              <Select.Option value="deadline">{t('dashboard.eventTypeDeadline')}</Select.Option>
              <Select.Option value="holiday">{t('dashboard.eventTypeHoliday')}</Select.Option>
              <Select.Option value="birthday">{t('dashboard.eventTypeBirthday')}</Select.Option>
              <Select.Option value="training">{t('dashboard.eventTypeTraining')}</Select.Option>
              <Select.Option value="review">{t('dashboard.eventTypeReview')}</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label={t('dashboard.selectedDate')}>
            <div className="text-gray-700 dark:text-gray-300 font-medium">
              {selectedDate?.format('MMMM DD, YYYY')}
            </div>
          </Form.Item>

          <Form.Item name="time" label={t('dashboard.eventTimeOptional')}>
            <TimePicker format="HH:mm" className="w-full" />
          </Form.Item>

          <Form.Item name="description" label={t('dashboard.eventDescriptionOptional')}>
            <Input.TextArea rows={3} placeholder={t('dashboard.eventDescriptionPlaceholder')} />
          </Form.Item>

          {editingEvent && (
            <Button
              danger
              block
              onClick={() => handleDeleteEvent(editingEvent.id)}
              loading={deleteEventMutation.isPending}
            >
              {t('dashboard.deleteEventBtn')}
            </Button>
          )}
        </Form>
      </Modal>
    </div>
  )
})

ManagerDashboard.displayName = 'ManagerDashboard'

export default ManagerDashboard
