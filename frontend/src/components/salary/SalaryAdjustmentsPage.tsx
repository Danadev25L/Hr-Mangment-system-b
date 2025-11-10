'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Card,
  Form,
  Select,
  InputNumber,
  Input,
  Button,
  Space,
  message,
  Tabs,
  Row,
  Col,
  Breadcrumb,
  DatePicker,
  Divider,
  List,
  Tag,
  Typography,
  Spin,
  type TabsProps,
  Table,
  Modal,
  Popconfirm
} from 'antd'
import {
  DollarOutlined,
  HomeOutlined,
  SaveOutlined,
  GiftOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  UserOutlined,
  BankOutlined,
  HistoryOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import apiClient from '@/lib/api'
import { useLocale, useTranslations } from 'next-intl'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { 
  PageHeader,
  EnhancedCard,
  EnhancedButton,
} from '@/components/ui'
import { SalaryAdjustmentIllustration } from '@/components/ui/illustrations'
import { ArrowLeftOutlined } from '@ant-design/icons'

const { Option } = Select
const { Title, Text } = Typography
const { TextArea } = Input

interface SalaryAdjustmentsPageProps {
  role: 'admin' | 'manager'
  title?: string
  description?: string
}

export default function SalaryAdjustmentsPage({ role, title, description }: SalaryAdjustmentsPageProps) {
  const t = useTranslations()
  const locale = useLocale()
  const queryClient = useQueryClient()
  
  const [bonusForm] = Form.useForm()
  const [deductionForm] = Form.useForm()
  const [overtimeForm] = Form.useForm()
  const [salaryForm] = Form.useForm()
  const [editForm] = Form.useForm()

  const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>()
  const [selectedEmployee, setSelectedEmployee] = useState<number | undefined>()
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1)
  const [selectedYear, setSelectedYear] = useState(dayjs().year())
  const [editingAdjustment, setEditingAdjustment] = useState<any>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const basePath = role === 'admin' ? '/admin' : '/manager'
  const salaryListPath = `/${locale}${basePath}/salary`
  
  const handleNavigation = (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path
    }
  }

  // Fetch departments
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiClient.getDepartments()
  })

  const departments = Array.isArray(departmentsData) ? departmentsData : []

  // Fetch employees by department (only active employees)
  const { data: employeesData, isLoading: employeesLoading, error: employeesError } = useQuery({
    queryKey: ['employees-by-department', selectedDepartment],
    queryFn: async () => {
      if (!selectedDepartment) return { data: [] }
      const response = await apiClient.getUsers(1, 1000, { departmentId: selectedDepartment })
      return response
    },
    enabled: !!selectedDepartment
  })

  // Filter only active employees
  const employees = ((employeesData as any)?.data || []).filter((emp: any) => emp.active !== false)

  // Get selected employee details
  const selectedEmployeeData = employees.find((emp: any) => emp.id === selectedEmployee)

  // Fetch attendance stats for selected employee
  const { data: attendanceStats } = useQuery({
    queryKey: ['employee-attendance-stats', selectedEmployee, selectedMonth, selectedYear],
    queryFn: () => apiClient.getEmployeeAttendanceStats(selectedEmployee!, selectedMonth, selectedYear),
    enabled: !!selectedEmployee
  })

  // Debug log to check data structure
  useEffect(() => {
    if (attendanceStats) {
      console.log('🔍 Attendance Stats Data:', attendanceStats)
      console.log('🔍 Summary:', attendanceStats.summary)
    }
  }, [attendanceStats])

  // Add bonus mutation
  const bonusMutation = useMutation({
    mutationFn: (values: any) => apiClient.addBonus(values),
    onSuccess: () => {
      message.success(t('salary.bonusAddedSuccess'))
      bonusForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['salary-list'] })
      queryClient.invalidateQueries({ queryKey: ['employee-adjustments'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || t('salary.bonusAddedError'))
    }
  })

  // Add deduction mutation
  const deductionMutation = useMutation({
    mutationFn: (values: any) => apiClient.addDeduction(values),
    onSuccess: () => {
      message.success(t('salary.deductionAddedSuccess'))
      deductionForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['salary-list'] })
      queryClient.invalidateQueries({ queryKey: ['employee-adjustments'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || t('salary.deductionAddedError'))
    }
  })

  // Add overtime mutation (using addBonus as overtime adds to salary)
  const overtimeMutation = useMutation({
    mutationFn: (values: any) => {
      return apiClient.addOvertime({
        employeeId: values.employeeId,
        amount: values.amount,
        hours: values.hours,
        reason: values.reason,
        date: values.date,
        month: values.month,
        year: values.year
      })
    },
    onSuccess: () => {
      message.success(t('salary.overtimeAddedSuccess'))
      overtimeForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['salary-list'] })
      queryClient.invalidateQueries({ queryKey: ['employee-adjustments'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || t('salary.overtimeAddedError'))
    }
  })

  // Update base salary mutation
  const updateBaseSalaryMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await apiClient.updateUser(values.employeeId, { baseSalary: values.baseSalary })
      return response
    },
    onSuccess: () => {
      message.success(t('salary.salaryUpdatedSuccess'))
      salaryForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['employees-by-department'] })
      queryClient.invalidateQueries({ queryKey: ['salary-list'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || t('salary.salaryUpdatedError'))
    }
  })

  // Fetch employee adjustments
  const { data: adjustmentsData, isLoading: adjustmentsLoading, refetch: refetchAdjustments } = useQuery({
    queryKey: ['employee-adjustments', selectedEmployee, selectedMonth, selectedYear],
    queryFn: () => apiClient.getEmployeeAdjustments(selectedEmployee!, selectedMonth, selectedYear),
    enabled: !!selectedEmployee
  })

  const adjustments = adjustmentsData?.adjustments || []

  // Update adjustment mutation
  const updateAdjustmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiClient.updateAdjustment(id, data),
    onSuccess: () => {
      message.success(t('salary.updateSuccess'))
      setIsEditModalOpen(false)
      setEditingAdjustment(null)
      editForm.resetFields()
      refetchAdjustments()
      queryClient.invalidateQueries({ queryKey: ['salary-list'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || t('salary.updateError'))
    }
  })

  // Delete adjustment mutation
  const deleteAdjustmentMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteAdjustment(id),
    onSuccess: () => {
      message.success(t('salary.deleteSuccess'))
      refetchAdjustments()
      queryClient.invalidateQueries({ queryKey: ['salary-list'] })
    },
    onError: (error: any) => {
      if (error.response?.data?.message?.includes('already been applied')) {
        message.error(t('salary.cannotDeleteApplied'))
      } else {
        message.error(error.response?.data?.message || t('salary.deleteError'))
      }
    }
  })

  const handleAddBonus = () => {
    if (!selectedEmployee) {
      message.warning(t('salary.selectEmployeeFirst'))
      return
    }

    bonusForm.validateFields().then(values => {
      bonusMutation.mutate({
        employeeId: selectedEmployee,
        amount: values.amount,
        reason: values.reason,
        month: selectedMonth,
        year: selectedYear
      })
    })
  }

  const handleAddDeduction = () => {
    if (!selectedEmployee) {
      message.warning(t('salary.selectEmployeeFirst'))
      return
    }

    deductionForm.validateFields().then(values => {
      deductionMutation.mutate({
        employeeId: selectedEmployee,
        amount: values.amount,
        reason: values.reason,
        month: selectedMonth,
        year: selectedYear
      })
    })
  }

  const handleAddOvertime = () => {
    if (!selectedEmployee) {
      message.warning(t('salary.selectEmployeeFirst'))
      return
    }

    overtimeForm.validateFields().then(values => {
      // Validate that either amount or hours is provided
      if (!values.amount && !values.hours) {
        message.error(t('salary.overtimeAmountOrHoursRequired'))
        return
      }

      overtimeMutation.mutate({
        employeeId: selectedEmployee,
        amount: values.amount,
        hours: values.hours,
        reason: values.notes || 'Overtime payment',
        date: values.date ? dayjs(values.date).format('YYYY-MM-DD') : null,
        month: selectedMonth,
        year: selectedYear
      })
    })
  }

  const handleRaiseSalary = () => {
    if (!selectedEmployee) {
      message.warning(t('salary.selectEmployeeFirst'))
      return
    }

    salaryForm.validateFields().then(values => {
      updateBaseSalaryMutation.mutate({
        employeeId: selectedEmployee,
        baseSalary: values.newBaseSalary
      })
    })
  }

  const handleEditAdjustment = (adjustment: any) => {
    setEditingAdjustment(adjustment)
    editForm.setFieldsValue({
      amount: parseFloat(adjustment.amount),
      reason: adjustment.reason
    })
    setIsEditModalOpen(true)
  }

  const handleUpdateAdjustment = () => {
    editForm.validateFields().then(values => {
      updateAdjustmentMutation.mutate({
        id: editingAdjustment.id,
        data: values
      })
    })
  }

  const handleDeleteAdjustment = (id: number) => {
    deleteAdjustmentMutation.mutate(id)
  }

  const getAdjustmentTypeColor = (type: string) => {
    switch (type) {
      case 'bonus': return 'green'
      case 'deduction': return 'red'
      case 'overtime': return 'blue'
      case 'penalty': return 'orange'
      case 'correction': return 'purple'
      default: return 'default'
    }
  }

  const getAdjustmentTypeLabel = (type: string) => {
    switch (type) {
      case 'bonus': return t('salary.bonus')
      case 'deduction': return t('salary.deduction')
      case 'overtime': return t('salary.overtime')
      default: return type
    }
  }

  // Tabs items configuration
  const tabItems: TabsProps['items'] = [
    {
      key: 'bonus',
      label: (
        <span className="flex items-center gap-2">
          <GiftOutlined />
          {t('salary.bonus')}
        </span>
      ),
      children: (
        <Form form={bonusForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label={t('salary.bonusAmount')}
                name="amount"
                rules={[{ required: true, message: t('salary.enterAmount') }]}
              >
                <InputNumber
                  prefix="$"
                  style={{ width: '100%' }}
                  size="large"
                  min={0}
                  placeholder={t('salary.enterAmount')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('salary.appliedTo')}>
                <Input 
                  size="large"
                  value={`${dayjs().month(selectedMonth - 1).format('MMMM')} ${selectedYear}`}
                  disabled
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label={t('salary.reason')}
            name="reason"
            rules={[{ required: true, message: t('salary.enterReason') }]}
          >
            <TextArea
              rows={3}
              placeholder={t('salary.reasonPlaceholder')}
              size="large"
            />
          </Form.Item>
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            onClick={handleAddBonus}
            loading={bonusMutation.isPending}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0"
            disabled={!selectedEmployee}
          >
            {t('salary.addBonus')}
          </Button>
        </Form>
      )
    },
    {
      key: 'deduction',
      label: (
        <span className="flex items-center gap-2">
          <WarningOutlined />
          {t('salary.deduction')}
        </span>
      ),
      children: (
        <>
          {/* Attendance Stats Display */}
          {selectedEmployee && attendanceStats?.summary && (
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
              <div className="font-semibold text-gray-700 dark:text-gray-200 mb-3">{t('salary.attendanceSummary')} - {dayjs().month(selectedMonth - 1).format('MMMM')} {selectedYear}</div>
              <Row gutter={[16, 12]}>
                <Col xs={12} md={6}>
                  <div className="text-center p-2 bg-white dark:bg-gray-700 rounded border dark:border-gray-600">
                    <div className="text-red-600 dark:text-red-400 font-bold text-xl">{attendanceStats.summary.absentDays || 0}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{t('salary.daysAbsent')}</div>
                  </div>
                </Col>
                <Col xs={12} md={6}>
                  <div className="text-center p-2 bg-white dark:bg-gray-700 rounded border dark:border-gray-600">
                    <div className="text-orange-600 dark:text-orange-400 font-bold text-xl">{attendanceStats.summary.lateDays || 0}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{t('salary.daysLate')}</div>
                  </div>
                </Col>
                <Col xs={12} md={6}>
                  <div className="text-center p-2 bg-white dark:bg-gray-700 rounded border dark:border-gray-600">
                    <div className="text-blue-600 dark:text-blue-400 font-bold text-xl">{attendanceStats.summary.leaveDays || 0}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{t('salary.daysOnLeave')}</div>
                  </div>
                </Col>
                <Col xs={12} md={6}>
                  <div className="text-center p-2 bg-white dark:bg-gray-700 rounded border dark:border-gray-600">
                    <div className="text-purple-600 dark:text-purple-400 font-bold text-xl">
                      {Math.floor((attendanceStats.summary.totalWorkingHours || 0) / 60)}h {(attendanceStats.summary.totalWorkingHours || 0) % 60}m
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{t('salary.totalHours')}</div>
                  </div>
                </Col>
              </Row>
              <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
                {t('salary.attendanceTip')} {t('salary.attendanceTipExample', { count: attendanceStats.summary.absentDays })}
              </div>
            </div>
          )}

          {/* No Attendance Data Message */}
          {selectedEmployee && attendanceStats && !attendanceStats.summary && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center text-gray-500 dark:text-gray-400 text-sm">
              {t('salary.noAttendanceData')} {dayjs().month(selectedMonth - 1).format('MMMM')} {selectedYear}
            </div>
          )}

          <Form form={deductionForm} layout="vertical">
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label={t('salary.deductionAmount')}
                  name="amount"
                  rules={[{ required: true, message: t('salary.enterDeductionAmount') }]}
                >
                  <InputNumber
                    prefix="$"
                    style={{ width: '100%' }}
                    size="large"
                    min={0}
                    placeholder={t('salary.enterDeductionAmount')}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label={t('salary.appliedTo')}>
                  <Input 
                    size="large"
                    value={`${dayjs().month(selectedMonth - 1).format('MMMM')} ${selectedYear}`}
                    disabled
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              label={t('salary.reason')}
              name="reason"
              rules={[{ required: true, message: t('salary.enterDeductionReason') }]}
            >
              <TextArea
                rows={3}
                placeholder={t('salary.deductionReasonPlaceholder')}
                size="large"
              />
            </Form.Item>

            {/* Quick Fill Buttons for Attendance-Based Deductions */}
            {attendanceStats?.summary && (attendanceStats.summary.absentDays > 0 || attendanceStats.summary.lateDays > 0 || attendanceStats.summary.leaveDays > 0) && (
              <div className="mb-4">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">{t('salary.quickFillReason')}</div>
                <Space wrap>
                  {attendanceStats.summary.absentDays > 0 && (
                    <Button
                      size="small"
                      onClick={() => deductionForm.setFieldsValue({ 
                        reason: t('salary.quickFillAbsent', { count: attendanceStats.summary.absentDays, period: `${dayjs().month(selectedMonth - 1).format('MMMM')} ${selectedYear}` })
                      })}
                    >
                      {t('salary.absentDays', { count: attendanceStats.summary.absentDays })}
                    </Button>
                  )}
                  {attendanceStats.summary.lateDays > 0 && (
                    <Button
                      size="small"
                      onClick={() => deductionForm.setFieldsValue({ 
                        reason: t('salary.quickFillLate', { count: attendanceStats.summary.lateDays, period: `${dayjs().month(selectedMonth - 1).format('MMMM')} ${selectedYear}` })
                      })}
                    >
                      {t('salary.lateTimes', { count: attendanceStats.summary.lateDays })}
                    </Button>
                  )}
                  {attendanceStats.summary.leaveDays > 0 && (
                    <Button
                      size="small"
                      onClick={() => deductionForm.setFieldsValue({ 
                        reason: t('salary.quickFillLeave', { count: attendanceStats.summary.leaveDays, period: `${dayjs().month(selectedMonth - 1).format('MMMM')} ${selectedYear}` })
                      })}
                    >
                      {t('salary.leaveDays', { count: attendanceStats.summary.leaveDays })}
                    </Button>
                  )}
                </Space>
              </div>
            )}

            <Button
              type="primary"
              danger
              size="large"
              icon={<SaveOutlined />}
              onClick={handleAddDeduction}
              loading={deductionMutation.isPending}
              disabled={!selectedEmployee}
            >
              {t('salary.addDeduction')}
            </Button>
          </Form>
        </>
      )
    },
    {
      key: 'overtime',
      label: (
        <span className="flex items-center gap-2">
          <ClockCircleOutlined />
          {t('salary.overtime')}
        </span>
      ),
      children: (
        <Form form={overtimeForm} layout="vertical">
          {/* Show overtime hours from attendance if available */}
          {selectedEmployee && attendanceStats?.summary?.totalOvertimeHours > 0 && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-3xl">⏰</div>
                <div className="flex-1">
                  <div className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    {t('salary.attendanceOvertimeDetected')}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    {t('salary.totalOvertimeHours')}: <strong>{Math.floor(attendanceStats.summary.totalOvertimeHours / 60)}h {attendanceStats.summary.totalOvertimeHours % 60}m</strong>
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    💡 {t('salary.overtimeTip')}
                  </div>
                </div>
              </div>
            </div>
          )}

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label={t('salary.overtimeHours')}
                name="hours"
                tooltip={t('salary.overtimeHoursTooltip')}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  size="large"
                  min={0}
                  step={0.5}
                  placeholder={t('salary.overtimeHoursPlaceholder')}
                  suffix={t('salary.hours')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label={t('salary.overtimeAmount')}
                name="amount"
                tooltip={t('salary.overtimeAmountTooltip')}
              >
                <InputNumber
                  prefix="$"
                  style={{ width: '100%' }}
                  size="large"
                  min={0}
                  placeholder={t('salary.overtimeAmountPlaceholder')}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label={`${t('salary.overtimeDate')} (${t('common.optional')})`}
                name="date"
              >
                <DatePicker
                  style={{ width: '100%' }}
                  size="large"
                  format="YYYY-MM-DD"
                  placeholder={t('salary.selectDateOptional')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-7">
                {t('salary.dateOptionalHint')}
              </div>
            </Col>
          </Row>
          <Form.Item label={t('salary.overtimeNotes')} name="notes">
            <TextArea
              rows={2}
              placeholder={t('salary.overtimeNotesPlaceholder')}
              size="large"
            />
          </Form.Item>
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            onClick={handleAddOvertime}
            loading={overtimeMutation.isPending}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-0"
            disabled={!selectedEmployee}
          >
            {t('salary.recordOvertime')}
          </Button>
        </Form>
      )
    },
    {
      key: 'raise',
      label: (
        <span className="flex items-center gap-2">
          <RiseOutlined />
          {t('salary.raiseBaseSalary')}
        </span>
      ),
      children: (
        <Form form={salaryForm} layout="vertical">
          <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 dark:border-amber-400 rounded">
            <Text type="warning" className="font-semibold dark:text-amber-300">
              {t('salary.salaryRaiseWarning')}
            </Text>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {t('salary.salaryRaiseDescription')}
            </p>
          </div>

          {selectedEmployeeData && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary" className="text-xs dark:text-gray-400">{t('salary.currentBaseSalary')}</Text>
                  <div className="text-2xl font-bold text-gray-700 dark:text-gray-200">
                    ${parseFloat(selectedEmployeeData.baseSalary || 0).toLocaleString()}
                  </div>
                </Col>
                <Col span={12}>
                  <Text type="secondary" className="text-xs dark:text-gray-400">{t('salary.employee')}</Text>
                  <div className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                    {selectedEmployeeData.fullName}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedEmployeeData.employeeCode} - {selectedEmployeeData.department?.departmentName || 'N/A'}
                  </div>
                </Col>
              </Row>
            </div>
          )}

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label={t('salary.newBaseSalary')}
                name="newBaseSalary"
                rules={[
                  { required: true, message: t('salary.enterNewBaseSalary') },
                  { 
                    type: 'number', 
                    min: 0, 
                    message: t('salary.salaryMustBePositive')
                  }
                ]}
              >
                <InputNumber
                  prefix="$"
                  style={{ width: '100%' }}
                  size="large"
                  min={0}
                  placeholder={t('salary.newBaseSalaryPlaceholder')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('salary.effectiveDate')}>
                <Input 
                  size="large"
                  value={t('salary.immediate')}
                  disabled
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Button
            type="primary"
            size="large"
            icon={<RiseOutlined />}
            onClick={handleRaiseSalary}
            loading={updateBaseSalaryMutation.isPending}
            className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 border-0"
            disabled={!selectedEmployee}
          >
            {t('salary.updateBaseSalary')}
          </Button>
        </Form>
      )
    },
    {
      key: 'history',
      label: (
        <span className="flex items-center gap-2">
          <HistoryOutlined />
          {t('salary.history')}
        </span>
      ),
      children: (
        <div>
          {!selectedEmployee ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <HistoryOutlined className="text-5xl mb-4" />
              <p>{t('salary.selectEmployeeFirst')}</p>
            </div>
          ) : adjustmentsLoading ? (
            <div className="text-center py-12">
              <Spin size="large" />
              <p className="mt-4 text-gray-500 dark:text-gray-400">{t('salary.loadingAdjustments')}</p>
            </div>
          ) : adjustments.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <HistoryOutlined className="text-5xl mb-4" />
              <p>{t('salary.noAdjustments')}</p>
            </div>
          ) : (
            <Table
              dataSource={adjustments}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              columns={[
                {
                  title: t('salary.adjustmentType'),
                  dataIndex: 'adjustmentType',
                  key: 'adjustmentType',
                  render: (type: string) => (
                    <Tag color={getAdjustmentTypeColor(type)}>
                      {getAdjustmentTypeLabel(type)}
                    </Tag>
                  )
                },
                {
                  title: t('salary.adjustmentAmount'),
                  dataIndex: 'amount',
                  key: 'amount',
                  render: (amount: string) => (
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      ${parseFloat(amount).toLocaleString()}
                    </span>
                  )
                },
                {
                  title: t('salary.adjustmentReason'),
                  dataIndex: 'reason',
                  key: 'reason',
                  ellipsis: true
                },
                {
                  title: t('salary.adjustmentDate'),
                  dataIndex: 'createdAt',
                  key: 'createdAt',
                  render: (date: string) => dayjs(date).format('MMM DD, YYYY')
                },
                {
                  title: t('salary.status'),
                  dataIndex: 'isApplied',
                  key: 'isApplied',
                  render: (isApplied: boolean) => (
                    <Tag color={isApplied ? 'green' : 'orange'}>
                      {isApplied ? t('salary.applied') : t('salary.notApplied')}
                    </Tag>
                  )
                },
                {
                  title: t('salary.actions'),
                  key: 'actions',
                  render: (_, record: any) => (
                    <Space>
                      <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleEditAdjustment(record)}
                        disabled={record.isApplied}
                      >
                        {t('salary.edit')}
                      </Button>
                      <Popconfirm
                        title={t('salary.deleteConfirm')}
                        onConfirm={() => handleDeleteAdjustment(record.id)}
                        okText={t('common.yes')}
                        cancelText={t('common.no')}
                        disabled={record.isApplied}
                      >
                        <Button
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                          disabled={record.isApplied}
                        >
                          {t('salary.delete')}
                        </Button>
                      </Popconfirm>
                    </Space>
                  )
                }
              ]}
            />
          )}

          {/* Edit Modal */}
          <Modal
            title={t('salary.editAdjustment')}
            open={isEditModalOpen}
            onOk={handleUpdateAdjustment}
            onCancel={() => {
              setIsEditModalOpen(false)
              setEditingAdjustment(null)
              editForm.resetFields()
            }}
            confirmLoading={updateAdjustmentMutation.isPending}
          >
            <Form form={editForm} layout="vertical" className="mt-4">
              <Form.Item
                label={t('salary.adjustmentAmount')}
                name="amount"
                rules={[{ required: true, message: t('salary.enterAmount') }]}
              >
                <InputNumber
                  prefix="$"
                  style={{ width: '100%' }}
                  min={0}
                  placeholder={t('salary.enterAmount')}
                />
              </Form.Item>
              <Form.Item
                label={t('salary.adjustmentReason')}
                name="reason"
                rules={[{ required: true, message: t('salary.enterReason') }]}
              >
                <TextArea
                  rows={3}
                  placeholder={t('salary.reasonPlaceholder')}
                />
              </Form.Item>
            </Form>
          </Modal>
        </div>
      )
    }
  ]

  return (
    <DashboardLayout role={role === 'admin' ? 'ROLE_ADMIN' : 'ROLE_MANAGER'}>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title={title || t('salary.title')}
          description={description || t('salary.subtitle')}
          icon={<SalaryAdjustmentIllustration />}
          gradient="green"
          action={
            <EnhancedButton
              variant="secondary"
              icon={<ArrowLeftOutlined />}
              onClick={() => handleNavigation(salaryListPath)}
            >
              {t('salary.backToSalaryList')}
            </EnhancedButton>
          }
        />

        {/* Selection Card */}
        <EnhancedCard>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <UserOutlined className="text-green-600 dark:text-green-400" />
            {t('salary.employeeSelection')}
          </h3>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <div className="mb-2 font-medium text-gray-700 dark:text-gray-300">{t('salary.period')}</div>
            <Space>
              <Select
                value={selectedMonth}
                onChange={setSelectedMonth}
                style={{ width: 120 }}
                size="large"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <Option key={month} value={month}>
                    {dayjs().month(month - 1).format('MMM')}
                  </Option>
                ))}
              </Select>
              <Select
                value={selectedYear}
                onChange={setSelectedYear}
                style={{ width: 100 }}
                size="large"
              >
                {Array.from({ length: 5 }, (_, i) => dayjs().year() - i).map(year => (
                  <Option key={year} value={year}>{year}</Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col xs={24} md={9}>
            <div className="mb-2 font-medium text-gray-700 dark:text-gray-300">{t('salary.department')}</div>
            <Select
              value={selectedDepartment}
              onChange={(value) => {
                setSelectedDepartment(value)
                setSelectedEmployee(undefined)
              }}
              placeholder={t('salary.selectDepartment')}
              style={{ width: '100%' }}
              allowClear
              size="large"
              suffixIcon={<BankOutlined />}
            >
              {departments.map((dept: any) => (
                <Option key={dept.id} value={dept.id}>
                  {dept.departmentName}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={9}>
            <div className="mb-2 font-medium text-gray-700 dark:text-gray-300">{t('salary.employee')}</div>
            <Select
              value={selectedEmployee}
              onChange={setSelectedEmployee}
              placeholder={employeesLoading ? t('salary.loadingEmployees') : !selectedDepartment ? t('salary.selectDepartmentFirst') : t('salary.selectEmployee')}
              style={{ width: '100%' }}
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              size="large"
              suffixIcon={<UserOutlined />}
              disabled={!selectedDepartment || employeesLoading}
              loading={employeesLoading}
              notFoundContent={!selectedDepartment ? t('salary.selectDepartmentFirst') : employeesLoading ? <Spin size="small" /> : t('salary.noEmployeesFound')}
            >
              {employees.map((emp: any) => (
                <Option key={emp.id} value={emp.id} label={emp.fullName}>
                  {emp.fullName} ({emp.employeeCode})
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        {selectedEmployeeData && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500 dark:border-blue-400 rounded">
            <Row gutter={16}>
              <Col span={6}>
                <Text type="secondary" className="text-xs dark:text-gray-400">{t('salary.employeeCode')}</Text>
                <div className="font-semibold text-gray-900 dark:text-gray-100">{selectedEmployeeData.employeeCode}</div>
              </Col>
              <Col span={6}>
                <Text type="secondary" className="text-xs dark:text-gray-400">{t('salary.department')}</Text>
                <div className="font-semibold text-gray-900 dark:text-gray-100">{selectedEmployeeData.department?.departmentName || 'N/A'}</div>
              </Col>
              <Col span={6}>
                <Text type="secondary" className="text-xs dark:text-gray-400">{t('salary.currentBaseSalary')}</Text>
                <div className="font-bold text-green-600 dark:text-green-400 text-lg">
                  ${parseFloat(selectedEmployeeData.baseSalary || 0).toLocaleString()}
                </div>
              </Col>
              <Col span={6}>
                <Text type="secondary" className="text-xs dark:text-gray-400">{t('salary.jobTitle')}</Text>
                <div className="font-semibold text-gray-900 dark:text-gray-100">{selectedEmployeeData.jobTitle || 'N/A'}</div>
              </Col>
            </Row>
          </div>
        )}
        </EnhancedCard>

        {/* Adjustment Tabs */}
        <EnhancedCard>
          <Tabs defaultActiveKey="bonus" size="large" tabBarGutter={32} items={tabItems} />
        </EnhancedCard>
      </div>
    </DashboardLayout>
  )
}
