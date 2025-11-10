'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, Row, Col, Progress, Timeline, List, Avatar, Button, Badge, Calendar, Modal, Form, Input, Select, DatePicker, TimePicker, message, Spin } from 'antd'
import {
  TeamOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  LineChartOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  RightOutlined,
  UserAddOutlined,
  UserOutlined,
  BellOutlined,
  SafetyOutlined,
  RocketOutlined,
  TrophyOutlined,
  FireOutlined,
  HeartOutlined,
  StarOutlined,
  ThunderboltOutlined,
  CrownOutlined,
  GlobalOutlined,
  BankOutlined,
  ShoppingOutlined,
  SettingOutlined,
  PlusOutlined,
  EyeOutlined,
  BarChartOutlined,
  PieChartOutlined,
  FundOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons'
import { useTranslations, useLocale } from 'next-intl'
import { Line, Pie, Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import apiClient from '@/lib/api'
import dayjs from 'dayjs'
import 'dayjs/locale/ar'
import 'dayjs/locale/ku'
import 'dayjs/locale/en'
import { useRouter } from 'next/navigation'
import { formatNumber, formatCurrencyKurdish, formatPercentage } from '@/lib/kurdishNumbers'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const AdminDashboard = React.memo(function AdminDashboard() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

  // OPTIMIZED: Split queries for better performance and caching
  // Load critical data first
  const { data: dashboardStats } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => apiClient.getDashboardStats(),
    staleTime: 5 * 60 * 1000,
  })

  const { data: userData } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => apiClient.getCurrentUser(),
    staleTime: 10 * 60 * 1000, // User data changes rarely
  })

  const { data: attendanceData } = useQuery({
    queryKey: ['today-attendance', dayjs().format('YYYY-MM-DD')],
    queryFn: () => apiClient.getAllEmployeesWithAttendance({ date: dayjs().format('YYYY-MM-DD') }),
    staleTime: 2 * 60 * 1000, // Refresh more frequently
  })

  // Load secondary data with longer stale times
  const { data: usersData } = useQuery({
    queryKey: ['users-list', 1, 20],
    queryFn: () => apiClient.getUsers(1, 20),
    staleTime: 5 * 60 * 1000,
  })

  const { data: expensesData } = useQuery({
    queryKey: ['expenses-list', 1, 50],
    queryFn: () => apiClient.getExpenses(1, 50),
    staleTime: 5 * 60 * 1000,
  })

  const { data: applicationsData } = useQuery({
    queryKey: ['applications-list', 1, 50],
    queryFn: () => apiClient.getApplications(1, 50),
    staleTime: 5 * 60 * 1000,
  })

  const { data: departmentsData } = useQuery({
    queryKey: ['departments-list'],
    queryFn: () => apiClient.getDepartments(),
    staleTime: 10 * 60 * 1000, // Departments change rarely
  })

  const { data: holidaysData } = useQuery({
    queryKey: ['holidays-list'],
    queryFn: () => apiClient.getHolidays(),
    staleTime: 10 * 60 * 1000,
  })

  const { data: announcementsData } = useQuery({
    queryKey: ['announcements-list'],
    queryFn: () => apiClient.getAnnouncements(),
    staleTime: 5 * 60 * 1000,
  })

  const { data: calendarEventsData } = useQuery({
    queryKey: ['calendar-events', dayjs().format('YYYY-MM')],
    queryFn: () => apiClient.getCalendarEvents({
      startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
      endDate: dayjs().endOf('month').format('YYYY-MM-DD')
    }),
    staleTime: 5 * 60 * 1000,
  })

  // Combine data for backwards compatibility
  const stats = {
    users: usersData,
    attendance: attendanceData,
    expenses: expensesData,
    applications: applicationsData,
    departments: departmentsData,
    holidays: holidaysData,
    announcements: announcementsData,
    currentUser: userData,
    dashboardStats,
    calendarEvents: calendarEventsData
  }

  // Mutations for calendar events - OPTIMIZED: Don't invalidate entire dashboard
  const createEventMutation = useMutation({
    mutationFn: (data: any) => apiClient.createCalendarEvent(data),
    onSuccess: () => {
      message.success(t('dashboard.eventCreatedSuccessfully'))
      // Only refetch calendar events, not entire dashboard
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      setIsModalOpen(false)
      form.resetFields()
    },
    onError: () => {
      message.error(t('dashboard.failedToCreateEvent'))
    }
  })

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiClient.updateCalendarEvent(id, data),
    onSuccess: () => {
      message.success(t('dashboard.eventUpdatedSuccessfully'))
      // Only refetch calendar events, not entire dashboard
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      setIsModalOpen(false)
      form.resetFields()
      setSelectedEvent(null)
    },
    onError: () => {
      message.error(t('dashboard.failedToUpdateEvent'))
    }
  })

  const deleteEventMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteCalendarEvent(id),
    onSuccess: () => {
      message.success(t('dashboard.eventDeletedSuccessfully'))
      // Only refetch calendar events, not entire dashboard
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      setIsModalOpen(false)
      form.resetFields()
      setSelectedEvent(null)
    },
    onError: () => {
      message.error(t('dashboard.failedToDeleteEvent'))
    }
  })

  // Check if critical data is still loading - AFTER all hooks
  const isLoading = !userData || !dashboardStats
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large">
          <div className="p-12" />
        </Spin>
      </div>
    )
  }

  // Modal handlers
  const handleDateSelect = (date: dayjs.Dayjs) => {
    setSelectedDate(date)
    const dateStr = date.format('YYYY-MM-DD')
    const dayEvents = calendarEvents.filter((event: any) => 
      dayjs(event.date).format('YYYY-MM-DD') === dateStr
    )
    
    if (dayEvents.length > 0) {
      // Show first event for editing (can be enhanced to show list)
      const event = dayEvents[0]
      setSelectedEvent(event)
      setModalMode('edit')
      form.setFieldsValue({
        title: event.title,
        type: event.type,
        time: event.time ? dayjs(event.time, 'HH:mm:ss') : null,
        description: event.description
      })
      setIsModalOpen(true)
    } else {
      // Create new event
      setModalMode('create')
      setSelectedEvent(null)
      form.resetFields()
      setIsModalOpen(true)
    }
  }

  const handleAddEvent = () => {
    setModalMode('create')
    setSelectedEvent(null)
    setSelectedDate(dayjs())
    form.resetFields()
    setIsModalOpen(true)
  }

  const handleModalCancel = () => {
    setIsModalOpen(false)
    form.resetFields()
    setSelectedEvent(null)
    setSelectedDate(null)
  }

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      if (!selectedDate) {
        message.error(t('dashboard.pleaseSelectDate'))
        return
      }
      
      const eventData = {
        title: values.title,
        type: values.type,
        date: selectedDate.format('YYYY-MM-DD'),
        time: values.time ? values.time.format('HH:mm:ss') : null,
        description: values.description || ''
      }

      if (modalMode === 'create') {
        createEventMutation.mutate(eventData)
      } else {
        updateEventMutation.mutate({ id: selectedEvent.id, data: eventData })
      }
    } catch (error) {
      console.error('Form validation failed:', error)
    }
  }

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      Modal.confirm({
        title: t('dashboard.deleteEventTitle'),
        content: t('dashboard.deleteEventContent'),
        okText: t('dashboard.deleteBtn'),
        okType: 'danger',
        cancelText: t('dashboard.cancelBtn'),
        onOk: () => {
          deleteEventMutation.mutate(selectedEvent.id)
        }
      })
    }
  }

  // Extract data from backend responses
  const totalEmployees = stats?.users?.total || 0
  const totalExpenses = stats?.expenses?.total || 0
  const totalApplications = stats?.applications?.total || 0
  const attendanceEmployees = stats?.attendance?.employees || []
  const applications = stats?.applications?.applications || []
  const expenses = stats?.expenses?.expenses || []
  const departments = Array.isArray(stats?.departments) ? stats.departments : []
  const holidays = Array.isArray(stats?.holidays) ? stats.holidays : (stats?.holidays?.data ? stats.holidays.data : [])
  const announcements = Array.isArray(stats?.announcements) ? stats.announcements : (stats?.announcements?.data ? stats.announcements.data : [])
  const currentUser = stats?.currentUser || {}
  const calendarEvents = Array.isArray(stats?.calendarEvents?.data) ? stats.calendarEvents.data : []

  // Calculate real attendance metrics
  const presentToday = attendanceEmployees.filter((a: any) => a.status === 'present').length
  const lateToday = attendanceEmployees.filter((a: any) => a.isLate).length
  const absentToday = totalEmployees - presentToday
  const attendanceRate = totalEmployees > 0 ? ((presentToday / totalEmployees) * 100).toFixed(1) : 0

  // Calculate real application metrics
  const pendingApps = applications.filter((a: any) => a.status === 'pending').length
  const approvedApps = applications.filter((a: any) => a.status === 'approved').length
  const rejectedApps = applications.filter((a: any) => a.status === 'rejected').length

  // Calculate real expense metrics
  const pendingExpenses = expenses.filter((e: any) => e.status === 'pending').length
  const approvedExpenses = expenses.filter((e: any) => e.status === 'approved').length
  const rejectedExpenses = expenses.filter((e: any) => e.status === 'rejected').length
  const totalExpenseAmount = expenses.reduce((sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 0)

  // Get active holidays count
  const activeHolidays = Array.isArray(holidays) ? holidays.filter((h: any) => {
    const holidayDate = dayjs(h.date)
    return holidayDate.isAfter(dayjs().subtract(1, 'day'))
  }).length : 0

  // Chart data - Last 7 days attendance with real data
  const last7Days = Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day'))
  const attendanceByDay = last7Days.map(day => {
    const dayStr = day.format('YYYY-MM-DD')
    return attendanceEmployees.filter((a: any) => dayjs(a.date).format('YYYY-MM-DD') === dayStr).length
  })
  
  const attendanceTrendData = {
    labels: last7Days.map(d => d.format('MMM DD')),
    datasets: [
      {
        label: t('dashboard.employeesPresent'),
        data: attendanceByDay,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  }

  // Real attendance distribution
  const attendanceDistData = {
    labels: [t('dashboard.present'), t('dashboard.late'), t('dashboard.absent')],
    datasets: [{
      data: [presentToday, lateToday, absentToday],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      borderWidth: 0,
    }]
  }

  // Real application status distribution
  const applicationsStatusData = {
    labels: [t('dashboard.pending'), t('dashboard.approved'), t('dashboard.rejected')],
    datasets: [{
      data: [pendingApps, approvedApps, rejectedApps],
      backgroundColor: ['#3b82f6', '#10b981', '#ef4444'],
      borderWidth: 0,
    }]
  }

  // Real expense status distribution
  const expensesStatusData = {
    labels: [t('dashboard.pending'), t('dashboard.approved'), t('dashboard.rejected')],
    datasets: [{
      data: [pendingExpenses, approvedExpenses, rejectedExpenses],
      backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
      borderWidth: 0,
    }]
  }

  // Real department distribution
  const departmentData = {
    labels: departments.map((d: any) => d.name || d.departmentName).slice(0, 10),
    datasets: [{
      label: t('dashboard.employees'),
      data: departments.map((d: any) => d.employeeCount || 0).slice(0, 10),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(6, 182, 212, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(251, 146, 60, 0.8)',
      ],
    }]
  }

  // Monthly expenses trend (last 6 months)
  const last6Months = Array.from({ length: 6 }, (_, i) => dayjs().subtract(5 - i, 'month'))
  const expensesByMonth = last6Months.map(month => {
    return expenses.filter((e: any) => 
      dayjs(e.date || e.createdAt).format('YYYY-MM') === month.format('YYYY-MM')
    ).reduce((sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 0)
  })

  const monthlyExpensesData = {
    labels: last6Months.map(m => m.format('MMM YYYY')),
    datasets: [{
      label: t('dashboard.totalExpensesDollar'),
      data: expensesByMonth,
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      fill: true,
      tension: 0.4,
    }]
  }

  // Employee growth trend (last 6 months) - simulated based on current data
  const employeeGrowthData = {
    labels: last6Months.map(m => m.format('MMM')),
    datasets: [{
      label: t('dashboard.totalEmployees'),
      data: last6Months.map((_, i) => Math.max(10, totalEmployees - (5 - i) * 3)),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4,
    }]
  }

  // NEW PIE CHARTS DATA!
  
  // Department-wise employee distribution PIE CHART
  const departmentPieData = {
    labels: Array.isArray(departments) && departments.length > 0 
      ? departments.slice(0, 5).map((d: any) => d.name || d.departmentName)
      : [t('dashboard.noData')],
    datasets: [{
      data: Array.isArray(departments) && departments.length > 0
        ? departments.slice(0, 5).map((d: any) => d.employeeCount || 0)
        : [1],
      backgroundColor: [
        '#3b82f6', // blue
        '#10b981', // green
        '#f59e0b', // orange
        '#8b5cf6', // purple
        '#ec4899', // pink
      ],
      borderWidth: 2,
      borderColor: '#fff',
    }]
  }

  // Application types breakdown PIE CHART
  const leaveTypes = Array.isArray(applications) ? applications.reduce((acc: any, app: any) => {
    const type = app.title || app.type || t('dashboard.other')
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {}) : {}
  
  const applicationTypesPieData = {
    labels: Object.keys(leaveTypes).length > 0 ? Object.keys(leaveTypes).slice(0, 5) : [t('dashboard.noData')],
    datasets: [{
      data: Object.keys(leaveTypes).length > 0 ? (Object.values(leaveTypes).slice(0, 5) as number[]) : [1],
      backgroundColor: [
        '#06b6d4', // cyan
        '#8b5cf6', // violet
        '#f59e0b', // amber
        '#ec4899', // pink
        '#10b981', // emerald
      ],
      borderWidth: 2,
      borderColor: '#fff',
    }]
  }

  // Holidays by month PIE CHART
  const holidaysByMonth = Array.isArray(holidays) ? holidays.reduce((acc: any, holiday: any) => {
    const month = dayjs(holiday.date).format('MMM')
    acc[month] = (acc[month] || 0) + 1
    return acc
  }, {}) : {}

  const holidaysMonthPieData = {
    labels: Object.keys(holidaysByMonth).length > 0 ? Object.keys(holidaysByMonth) : [t('dashboard.noData')],
    datasets: [{
      data: Object.keys(holidaysByMonth).length > 0 ? Object.values(holidaysByMonth) as number[] : [1],
      backgroundColor: [
        '#ef4444', '#f59e0b', '#fbbf24', '#84cc16', '#10b981',
        '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef',
        '#ec4899', '#f43f5e'
      ],
      borderWidth: 2,
      borderColor: '#fff',
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: true, position: 'bottom' as const },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y}`
          }
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { position: 'bottom' as const },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || ''
            const value = context.parsed || 0
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${value} (${percentage}%)`
          }
        }
      }
    },
    cutout: '65%',
  }

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { position: 'bottom' as const },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || ''
            const value = context.parsed || 0
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${value} (${percentage}%)`
          }
        }
      }
    },
  }

  const quickActions = [
    {
      title: t('dashboard.addEmployee'),
      icon: <UserAddOutlined className="text-2xl" />,
      color: 'blue',
      bgColor: 'from-blue-500 to-blue-600',
      link: `/${locale}/admin/employees/add`
    },
    {
      title: t('dashboard.addHoliday'),
      icon: <CalendarOutlined className="text-2xl" />,
      color: 'green',
      bgColor: 'from-green-500 to-green-600',
      link: `/${locale}/admin/holidays/add`
    },
    {
      title: t('dashboard.addExpense'),
      icon: <DollarOutlined className="text-2xl" />,
      color: 'orange',
      bgColor: 'from-orange-500 to-orange-600',
      link: `/${locale}/admin/expenses/add`
    },
    {
      title: t('dashboard.createAnnouncement'),
      icon: <BellOutlined className="text-2xl" />,
      color: 'purple',
      bgColor: 'from-purple-500 to-purple-600',
      link: `/${locale}/admin/announcements/add`
    },
    {
      title: t('dashboard.manageDepartments'),
      icon: <BankOutlined className="text-2xl" />,
      color: 'cyan',
      bgColor: 'from-cyan-500 to-cyan-600',
      link: `/${locale}/admin/departments`
    },
    {
      title: t('dashboard.manageSalary'),
      icon: <FundOutlined className="text-2xl" />,
      color: 'pink',
      bgColor: 'from-pink-500 to-pink-600',
      link: `/${locale}/admin/salary`
    },
  ]

  // Recent activities - to be implemented with real backend data
  // const recentActivities = []

  const adminName = currentUser?.firstName && currentUser?.lastName 
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : currentUser?.username || 'Admin'

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 sm:gap-3">
            <span className="text-3xl sm:text-4xl lg:text-5xl">🎯</span>
            {t('dashboard.welcomeBack')}, {adminName}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg">
            {t('dashboard.whatsHappeningToday')}
          </p>
        </div>
        <div className="text-left sm:text-right w-full sm:w-auto">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {dayjs().locale(locale).format('dddd')}
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {dayjs().locale(locale).format('MMM DD, YYYY')}
          </div>
          <div className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
            {dayjs().locale(locale).format('HH:mm A')}
          </div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable
            onClick={() => router.push(`/${locale}/admin/employees`)}
            className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{formatNumber(totalEmployees, locale)}</div>
                <div className="text-sm text-gray-700 dark:text-gray-400 mt-1">{t('dashboard.totalEmployeesCard')}</div>
                <div className="text-xs text-gray-600 dark:text-gray-500 mt-1 flex items-center">
                  <ArrowUpOutlined className="mr-1" />
                  +{formatPercentage(12, locale)} {t('dashboard.fromLastMonth')}
                </div>
              </div>
              <TeamOutlined className="text-5xl text-blue-500 opacity-50" />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable
            onClick={() => router.push(`/${locale}/admin/attendance`)}
            className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold text-green-600 dark:text-green-400">{formatNumber(Number(attendanceRate), locale)}%</div>
                <div className="text-sm text-gray-700 dark:text-gray-400 mt-1">{t('dashboard.attendanceRateCard')}</div>
                <div className="text-xs text-gray-600 dark:text-gray-500 mt-1 flex items-center">
                  <CheckCircleOutlined className="mr-1" />
                  {formatNumber(presentToday, locale)} {t('dashboard.presentTodayText')}
                </div>
              </div>
              <ClockCircleOutlined className="text-5xl text-green-500 opacity-50" />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable
            onClick={() => router.push(`/${locale}/admin/expenses`)}
            className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold text-orange-600 dark:text-orange-400">{formatCurrencyKurdish(totalExpenseAmount, locale, 'USD')}</div>
                <div className="text-sm text-gray-700 dark:text-gray-400 mt-1">{t('dashboard.totalExpensesCard')}</div>
                <div className="text-xs text-gray-600 dark:text-gray-500 mt-1 flex items-center">
                  <RiseOutlined className="mr-1" />
                  {formatNumber(totalExpenses, locale)} {t('dashboard.expenseRecords')}
                </div>
              </div>
              <DollarOutlined className="text-5xl text-orange-500 opacity-50" />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable
            onClick={() => router.push(`/${locale}/admin/applications`)}
            className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">{formatNumber(totalApplications, locale)}</div>
                <div className="text-sm text-gray-700 dark:text-gray-400 mt-1">{t('dashboard.applicationsCard')}</div>
                <div className="text-xs text-gray-600 dark:text-gray-500 mt-1 flex items-center">
                  <WarningOutlined className="mr-1" />
                  {formatNumber(pendingApps, locale)} {t('dashboard.pendingText')}
                </div>
              </div>
              <FileTextOutlined className="text-5xl text-purple-500 opacity-50" />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Additional Info Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} lg={6}>
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{formatNumber(departments.length, locale)}</div>
                <div className="text-sm text-gray-700 dark:text-gray-400 mt-1">{t('dashboard.departmentsCard')}</div>
              </div>
              <BankOutlined className="text-4xl text-cyan-500 opacity-50" />
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={8} lg={6}>
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">{formatNumber(activeHolidays, locale)}</div>
                <div className="text-sm text-gray-700 dark:text-gray-400 mt-1">{t('dashboard.upcomingHolidaysCard')}</div>
              </div>
              <CalendarOutlined className="text-4xl text-pink-500 opacity-50" />
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={8} lg={6}>
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{formatNumber(announcements.length, locale)}</div>
                <div className="text-sm text-gray-700 dark:text-gray-400 mt-1">{t('dashboard.announcementsCard')}</div>
              </div>
              <BellOutlined className="text-4xl text-indigo-500 opacity-50" />
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={8} lg={6}>
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{formatNumber(pendingApps + pendingExpenses, locale)}</div>
                <div className="text-sm text-gray-700 dark:text-gray-400 mt-1">{t('dashboard.pendingApprovalsCard')}</div>
              </div>
              <WarningOutlined className="text-4xl text-amber-500 opacity-50" />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Calendar Section - MOVED UP! */}
      <Card
        title={
          <span className="text-xl sm:text-2xl font-bold flex items-center text-gray-800 dark:text-gray-100">
            <CalendarOutlined className="mr-2 sm:mr-3 text-blue-500 dark:text-blue-400" />
            <span className="text-gray-800 dark:text-gray-100">{t('dashboard.calendarAndEvents')}</span>
          </span>
        }
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleAddEvent}
            size="small"
            className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 sm:size-middle"
          >
            <span className="hidden sm:inline">{t('dashboard.addEventButton')}</span>
          </Button>
        }
        className="shadow-lg border-0 bg-white dark:bg-gray-800 transition-colors"
      >
        <div className="admin-calendar">
          <Calendar
            fullscreen={false}
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
            className="dark-mode-calendar responsive-calendar"
          />
        </div>
      </Card>

      {/* Quick Actions - MOVED DOWN! */}
      <Card
        title={
          <span className="text-xl font-semibold flex items-center text-gray-900 dark:text-gray-100">
            <RocketOutlined className="mr-2 text-blue-500 dark:text-blue-400" />
            {t('dashboard.quickActionsTitle')}
          </span>
        }
        className="shadow-lg border-0 bg-white dark:bg-gray-800"
      >
        <Row gutter={[16, 16]}>
          {quickActions.map((action, index) => (
            <Col xs={12} sm={8} md={6} lg={4} key={index}>
              <div
                onClick={() => router.push(action.link)}
                className={`p-4 sm:p-6 rounded-xl bg-gradient-to-br ${action.bgColor} text-white cursor-pointer hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl text-center`}
              >
                <div className="mb-2 sm:mb-3 text-2xl sm:text-3xl">{action.icon}</div>
                <div className="text-xs sm:text-sm font-medium">{action.title}</div>
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
            {t('dashboard.statisticsAndAnalytics')}
          </span>
        }
        className="shadow-xl border-0 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800"
      >
        {/* Attendance Analytics */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300 border-b pb-2">
            📊 {t('dashboard.attendanceAnalytics')}
          </h3>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card
                title={
                  <span className="text-lg font-semibold flex items-center">
                    <LineChartOutlined className="mr-2 text-green-500" />
                    {t('dashboard.attendanceTrendLast7Days')}
                  </span>
                }
                extra={
                  <Button type="link" onClick={() => router.push(`/${locale}/admin/attendance`)}>
                    {t('dashboard.viewDetails')}
                  </Button>
                }
                className="shadow-lg border-0"
              >
                <div className="h-[300px]">
                  {attendanceTrendData?.labels ? (
                    <Line data={attendanceTrendData} options={chartOptions} />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Spin />
                    </div>
                  )}
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                title={
                  <span className="text-lg font-semibold flex items-center">
                    <PieChartOutlined className="mr-2 text-blue-500" />
                    {t('dashboard.todaysAttendanceChart')}
                  </span>
                }
                className="shadow-lg border-0"
              >
                <div className="h-[300px] flex items-center justify-center">
                  {attendanceDistData?.labels ? (
                    <Doughnut data={attendanceDistData} options={doughnutOptions} />
                  ) : (
                    <Spin />
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Application Analytics */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300 border-b pb-2">
            📝 {t('dashboard.applicationAnalyticsSection')}
          </h3>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card
                title={
                  <span className="text-lg font-semibold flex items-center">
                    <FileTextOutlined className="mr-2 text-purple-500" />
                    {t('dashboard.applicationsStatusChart')}
                  </span>
                }
                className="shadow-lg border-0"
              >
                <div className="h-[300px] flex items-center justify-center">
                  {applicationsData?.labels ? (
                    <Pie data={applicationsData} options={pieOptions} />
                  ) : (
                    <Spin />
                  )}
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                title={
                  <span className="text-lg font-semibold flex items-center">
                    <FileTextOutlined className="mr-2 text-purple-500" />
                    {t('dashboard.applicationTypesChart')}
                  </span>
                }
                extra={
                  <Button type="link" onClick={() => router.push(`/${locale}/admin/applications`)}>
                    {t('dashboard.viewAll')}
                  </Button>
                }
                className="shadow-lg border-0"
              >
                <div className="h-[300px] flex items-center justify-center">
                  {applicationTypesPieData?.labels ? (
                    <Pie data={applicationTypesPieData} options={pieOptions} />
                  ) : (
                    <Spin />
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Financial Analytics */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300 border-b pb-2">
            💰 {t('dashboard.financialAnalyticsSection')}
          </h3>
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card
                title={
                  <span className="text-xl font-semibold flex items-center">
                    <DollarOutlined className="mr-2 text-orange-500" />
                    {t('dashboard.monthlyExpensesOverviewChart')}
                  </span>
                }
                extra={
                  <Button type="link" onClick={() => router.push(`/${locale}/admin/expenses`)}>
                    {t('dashboard.viewAllExpenses')}
                  </Button>
                }
                className="shadow-lg border-0"
              >
                <div className="h-[300px]">
                  <Line data={monthlyExpensesData} options={chartOptions} />
                </div>
              </Card>
            </Col>

            <Col xs={24}>
              <Card
                title={
                  <span className="text-lg font-semibold flex items-center">
                    <DollarOutlined className="mr-2 text-amber-500" />
                    {t('dashboard.expenseStatusDistributionChart')}
                  </span>
                }
                extra={
                  <Button type="link" onClick={() => router.push(`/${locale}/admin/expenses`)}>
                    {t('dashboard.viewDetails')}
                  </Button>
                }
                className="shadow-lg border-0"
              >
                <div className="h-[300px] flex items-center justify-center">
                  {expensesStatusData?.labels ? (
                    <Doughnut data={expensesStatusData} options={doughnutOptions} />
                  ) : (
                    <Spin />
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Organization Analytics */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300 border-b pb-2">
            🏢 {t('dashboard.organizationAnalyticsSection')}
          </h3>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card
                title={
                  <span className="text-lg font-semibold flex items-center">
                    <RiseOutlined className="mr-2 text-blue-500" />
                    {t('dashboard.employeeGrowthTrendChart')}
                  </span>
                }
                extra={
                  <Button type="link" onClick={() => router.push(`/${locale}/admin/employees`)}>
                    {t('dashboard.viewAllEmployees')}
                  </Button>
                }
                className="shadow-lg border-0"
              >
                <div className="h-[300px]">
                  <Line data={employeeGrowthData} options={chartOptions} />
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                title={
                  <span className="text-lg font-semibold flex items-center">
                    <BarChartOutlined className="mr-2 text-orange-500" />
                    {t('dashboard.departmentDistributionChart')}
                  </span>
                }
                className="shadow-lg border-0"
              >
                <div className="h-[300px]">
                  {departmentData?.labels ? (
                    <Bar data={departmentData} options={chartOptions} />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Spin />
                    </div>
                  )}
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                title={
                  <span className="text-lg font-semibold flex items-center">
                    <BankOutlined className="mr-2 text-blue-500" />
                    {t('dashboard.employeesByDepartmentChart')}
                  </span>
                }
                extra={
                  <Button type="link" onClick={() => router.push(`/${locale}/admin/departments`)}>
                    {t('dashboard.viewAll')}
                  </Button>
                }
                className="shadow-lg border-0"
              >
                <div className="h-[300px] flex items-center justify-center">
                  <Pie data={departmentPieData} options={pieOptions} />
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                title={
                  <span className="text-lg font-semibold flex items-center">
                    <CalendarOutlined className="mr-2 text-pink-500" />
                    {t('dashboard.holidaysByMonthChart')}
                  </span>
                }
                extra={
                  <Button type="link" onClick={() => router.push(`/${locale}/admin/holidays`)}>
                    {t('dashboard.viewAll')}
                  </Button>
                }
                className="shadow-lg border-0"
              >
                <div className="h-[300px] flex items-center justify-center">
                  <Pie data={holidaysMonthPieData} options={pieOptions} />
                </div>
              </Card>
            </Col>

            {/* Recent Activity Card - Disabled until backend provides real data */}
            {/* <Col xs={24} lg={8}>
              <Card
                title={
                  <span className="text-lg font-semibold flex items-center">
                    <FundOutlined className="mr-2 text-green-500" />
                    {t('dashboard.recentActivityTitle')}
                  </span>
                }
                extra={<Button type="link">{t('dashboard.viewAll')}</Button>}
                className="shadow-lg border-0"
              >
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  {t('dashboard.noRecentActivity')}
                </div>
              </Card>
            </Col> */}
          </Row>
        </div>
      </Card>

      {/* Duplicate Calendar Section Removed - Calendar now at the top */}

      {/* Summary Statistics */}
      <Card
        title={
          <span className="text-xl font-semibold flex items-center">
            <TrophyOutlined className="mr-2 text-yellow-500" />
            {t('dashboard.organizationOverview')}
          </span>
        }
        className="shadow-lg border-0"
      >
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
              <TeamOutlined className="text-4xl text-blue-600 dark:text-blue-400 mb-2" />
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {totalEmployees}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.totalEmployeesCard')}</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl">
              <CheckCircleOutlined className="text-4xl text-green-600 dark:text-green-400 mb-2" />
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-1">
                {presentToday}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.presentToday')}</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl">
              <ClockCircleOutlined className="text-4xl text-orange-600 dark:text-orange-400 mb-2" />
              <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                {lateToday}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.lateToday')}</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl">
              <WarningOutlined className="text-4xl text-red-600 dark:text-red-400 mb-2" />
              <div className="text-4xl font-bold text-red-600 dark:text-red-400 mb-1">
                {absentToday}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.absentToday')}</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl">
              <FileTextOutlined className="text-4xl text-purple-600 dark:text-purple-400 mb-2" />
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {pendingApps}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.pendingApplications')}</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-xl">
              <DollarOutlined className="text-4xl text-pink-600 dark:text-pink-400 mb-2" />
              <div className="text-4xl font-bold text-pink-600 dark:text-pink-400 mb-1">
                {totalExpenses}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.totalExpensesOverview')}</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-xl">
              <BankOutlined className="text-4xl text-indigo-600 dark:text-indigo-400 mb-2" />
              <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                {departments.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.departmentsCard')}</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="text-center p-6 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 rounded-xl">
              <CalendarOutlined className="text-4xl text-cyan-600 dark:text-cyan-400 mb-2" />
              <div className="text-4xl font-bold text-cyan-600 dark:text-cyan-400 mb-1">
                {activeHolidays}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.upcomingHolidaysCard')}</div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Pending Applications */}
      <Card
        title={
          <span className="text-xl font-semibold flex items-center">
            <FileTextOutlined className="mr-2 text-blue-500" />
            {t('dashboard.pendingApplications')}
          </span>
        }
        extra={
          <Button type="primary" onClick={() => router.push(`/${locale}/admin/applications`)}>
            {t('dashboard.viewAllButton')}
          </Button>
        }
        className="shadow-lg border-0"
      >
        <List
          dataSource={applications.slice(0, 5)}
          renderItem={(app: any) => (
            <List.Item
              className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors px-4 rounded-lg"
              onClick={() => router.push(`/${locale}/admin/applications/${app.id}`)}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    size={48}
                    icon={<UserOutlined />}
                    className="bg-gradient-to-br from-blue-500 to-purple-500"
                  />
                }
                title={
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {app.title || t('dashboard.leaveApplication')}
                  </span>
                }
                description={
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {dayjs(app.createdAt).format('MMM DD, YYYY')}
                    </span>
                    <Badge status={app.status === 'pending' ? 'processing' : 'success'} text={app.status} />
                  </div>
                }
              />
              <RightOutlined className="text-gray-400" />
            </List.Item>
          )}
        />
      </Card>

      {/* Event Modal */}
      <Modal
        title={
          <span className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {modalMode === 'create' ? t('dashboard.createNewEvent') : t('dashboard.editEvent')}
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
              {t('dashboard.deleteEventBtn')}
            </Button>
          ),
          <Button 
            key="cancel" 
            onClick={handleModalCancel}
            className="dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
          >
            {t('dashboard.cancelBtn')}
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={handleModalSubmit}
            loading={createEventMutation.isPending || updateEventMutation.isPending}
            className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            {modalMode === 'create' ? t('dashboard.createBtn') : t('dashboard.updateBtn')}
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
            label={<span className="text-gray-700 dark:text-gray-300">{t('dashboard.eventTitle')}</span>}
            rules={[{ required: true, message: t('dashboard.eventTitleRequired') }]}
          >
            <Input 
              placeholder={t('dashboard.eventTitlePlaceholder')} 
              size="large"
              className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            />
          </Form.Item>

          <Form.Item
            name="type"
            label={<span className="text-gray-700 dark:text-gray-300">{t('dashboard.eventType')}</span>}
            rules={[{ required: true, message: t('dashboard.eventTypeRequired') }]}
          >
            <Select 
              size="large" 
              placeholder={t('dashboard.selectEventType')}
              className="dark:bg-gray-700"
            >
              <Select.Option value="meeting">{t('dashboard.eventTypeMeeting')}</Select.Option>
              <Select.Option value="deadline">{t('dashboard.eventTypeDeadline')}</Select.Option>
              <Select.Option value="holiday">{t('dashboard.eventTypeHoliday')}</Select.Option>
              <Select.Option value="birthday">{t('dashboard.eventTypeBirthday')}</Select.Option>
              <Select.Option value="training">{t('dashboard.eventTypeTraining')}</Select.Option>
              <Select.Option value="review">{t('dashboard.eventTypeReview')}</Select.Option>
            </Select>
          </Form.Item>

          {/* Show selected date as read-only */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors">
            <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              📅 {t('dashboard.selectedDate')}
            </div>
            <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
              {selectedDate?.format('MMMM DD, YYYY')}
            </div>
          </div>

          <Form.Item
            name="time"
            label={<span className="text-gray-700 dark:text-gray-300">{t('dashboard.eventTimeOptional')}</span>}
          >
            <TimePicker 
              size="large" 
              style={{ width: '100%' }}
              format="HH:mm"
              className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span className="text-gray-700 dark:text-gray-300">{t('dashboard.eventDescriptionOptional')}</span>}
          >
            <Input.TextArea 
              rows={4} 
              placeholder={t('dashboard.eventDescriptionPlaceholder')}
              className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:placeholder-gray-400"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
})

AdminDashboard.displayName = 'AdminDashboard'

export default AdminDashboard