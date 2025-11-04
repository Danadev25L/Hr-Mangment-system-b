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
  Spin
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
  BankOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import apiClient from '@/lib/api'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

const { Option } = Select
const { Title, Text } = Typography
const { TextArea } = Input
const { TabPane } = Tabs

interface SalaryAdjustmentsPageProps {
  role: 'admin' | 'manager'
}

export default function SalaryAdjustmentsPage({ role }: SalaryAdjustmentsPageProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const [bonusForm] = Form.useForm()
  const [deductionForm] = Form.useForm()
  const [overtimeForm] = Form.useForm()
  const [salaryForm] = Form.useForm()

  const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>()
  const [selectedEmployee, setSelectedEmployee] = useState<number | undefined>()
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1)
  const [selectedYear, setSelectedYear] = useState(dayjs().year())

  const basePath = role === 'admin' ? '/admin' : '/manager'
  const dashboardPath = `${basePath}/dashboard`
  const salaryListPath = `${basePath}/salary`

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
      message.success('Bonus added successfully!')
      bonusForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['salary-list'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to add bonus')
    }
  })

  // Add deduction mutation
  const deductionMutation = useMutation({
    mutationFn: (values: any) => apiClient.addDeduction(values),
    onSuccess: () => {
      message.success('Deduction added successfully!')
      deductionForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['salary-list'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to add deduction')
    }
  })

  // Add overtime mutation (using addBonus as overtime adds to salary)
  const overtimeMutation = useMutation({
    mutationFn: (values: any) => {
      return apiClient.addOvertime({
        employeeId: values.employeeId,
        amount: values.amount,
        reason: `Overtime on ${dayjs(values.date).format('YYYY-MM-DD')}${values.notes ? ': ' + values.notes : ''}`,
        month: values.month,
        year: values.year
      })
    },
    onSuccess: () => {
      message.success('Overtime recorded successfully!')
      overtimeForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['salary-list'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to record overtime')
    }
  })

  // Update base salary mutation
  const updateBaseSalaryMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await apiClient.updateUser(values.employeeId, { baseSalary: values.baseSalary })
      return response
    },
    onSuccess: () => {
      message.success('Base salary updated successfully!')
      salaryForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['employees-by-department'] })
      queryClient.invalidateQueries({ queryKey: ['salary-list'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to update base salary')
    }
  })

  const handleAddBonus = () => {
    if (!selectedEmployee) {
      message.warning('Please select an employee first')
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
      message.warning('Please select an employee first')
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
      message.warning('Please select an employee first')
      return
    }

    overtimeForm.validateFields().then(values => {
      overtimeMutation.mutate({
        employeeId: selectedEmployee,
        amount: values.amount,
        date: values.date,
        notes: values.notes,
        month: dayjs(values.date).month() + 1,
        year: dayjs(values.date).year()
      })
    })
  }

  const handleRaiseSalary = () => {
    if (!selectedEmployee) {
      message.warning('Please select an employee first')
      return
    }

    salaryForm.validateFields().then(values => {
      updateBaseSalaryMutation.mutate({
        employeeId: selectedEmployee,
        baseSalary: values.newBaseSalary
      })
    })
  }

  return (
    <DashboardLayout role={role === 'admin' ? 'ROLE_ADMIN' : 'ROLE_MANAGER'}>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            {
              title: (
              <span 
                className="flex items-center cursor-pointer hover:text-amber-600 transition-colors" 
                onClick={() => router.push(dashboardPath)}
              >
                <HomeOutlined className="mr-1" />
                Dashboard
              </span>
            ),
          },
          {
            title: (
              <span 
                className="flex items-center cursor-pointer hover:text-amber-600 transition-colors" 
                onClick={() => router.push(salaryListPath)}
              >
                <DollarOutlined className="mr-1" />
                Salary
              </span>
            ),
          },
          {
            title: 'Salary Management',
          },
        ]}
      />

      {/* Page Header */}
      <Card className="shadow-lg">
        <div className="bg-gradient-to-r from-amber-500 to-yellow-600 p-6 -m-6 mb-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <DollarOutlined className="text-white text-2xl" />
              </div>
              <div>
                <Title level={2} className="!text-white !mb-1">Salary Management</Title>
                <Text className="text-white/90">
                  Add bonuses, deductions, overtime and manage employee salaries
                </Text>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Selection Card */}
      <Card className="shadow-md">
        <Title level={4} className="mb-4 flex items-center gap-2">
          <UserOutlined className="text-amber-600" />
          Employee Selection
        </Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <div className="mb-2 font-medium text-gray-700">Period</div>
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
            <div className="mb-2 font-medium text-gray-700">Department</div>
            <Select
              value={selectedDepartment}
              onChange={(value) => {
                setSelectedDepartment(value)
                setSelectedEmployee(undefined)
              }}
              placeholder="Select Department"
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
            <div className="mb-2 font-medium text-gray-700">Employee</div>
            <Select
              value={selectedEmployee}
              onChange={setSelectedEmployee}
              placeholder={employeesLoading ? "Loading employees..." : !selectedDepartment ? "Select department first" : "Select Employee"}
              style={{ width: '100%' }}
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              size="large"
              suffixIcon={<UserOutlined />}
              disabled={!selectedDepartment || employeesLoading}
              loading={employeesLoading}
              notFoundContent={!selectedDepartment ? "Select department first" : employeesLoading ? <Spin size="small" /> : "No employees found"}
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
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded">
            <Row gutter={16}>
              <Col span={6}>
                <Text type="secondary" className="text-xs">Employee Code</Text>
                <div className="font-semibold">{selectedEmployeeData.employeeCode}</div>
              </Col>
              <Col span={6}>
                <Text type="secondary" className="text-xs">Department</Text>
                <div className="font-semibold">{selectedEmployeeData.department?.departmentName || 'N/A'}</div>
              </Col>
              <Col span={6}>
                <Text type="secondary" className="text-xs">Current Base Salary</Text>
                <div className="font-bold text-green-600 text-lg">
                  ${parseFloat(selectedEmployeeData.baseSalary || 0).toLocaleString()}
                </div>
              </Col>
              <Col span={6}>
                <Text type="secondary" className="text-xs">Job Title</Text>
                <div className="font-semibold">{selectedEmployeeData.jobTitle || 'N/A'}</div>
              </Col>
            </Row>
          </div>
        )}
      </Card>

      {/* Adjustment Tabs */}
      <Card className="shadow-md">
        <Tabs defaultActiveKey="bonus" size="large" tabBarGutter={32}>
          {/* Bonus Tab */}
          <TabPane
            tab={
              <span className="flex items-center gap-2">
                <GiftOutlined />
                Bonus
              </span>
            }
            key="bonus"
          >
            <Form form={bonusForm} layout="vertical">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Bonus Amount"
                    name="amount"
                    rules={[{ required: true, message: 'Please enter bonus amount' }]}
                  >
                    <InputNumber
                      prefix="$"
                      style={{ width: '100%' }}
                      size="large"
                      min={0}
                      placeholder="Enter amount"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Applied To">
                    <Input 
                      size="large"
                      value={`${dayjs().month(selectedMonth - 1).format('MMMM')} ${selectedYear}`}
                      disabled
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                label="Reason"
                name="reason"
                rules={[{ required: true, message: 'Please enter reason' }]}
              >
                <TextArea
                  rows={3}
                  placeholder="e.g., Performance bonus, Achievement award, Holiday bonus"
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
                Add Bonus
              </Button>
            </Form>
          </TabPane>

          {/* Deduction Tab */}
          <TabPane
            tab={
              <span className="flex items-center gap-2">
                <WarningOutlined />
                Deduction
              </span>
            }
            key="deduction"
          >
            {/* Attendance Stats Display */}
            {selectedEmployee && attendanceStats?.summary && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="font-semibold text-gray-700 mb-3">📊 Attendance Summary - {dayjs().month(selectedMonth - 1).format('MMMM')} {selectedYear}</div>
                <Row gutter={[16, 12]}>
                  <Col xs={12} md={6}>
                    <div className="text-center p-2 bg-white rounded border">
                      <div className="text-red-600 font-bold text-xl">{attendanceStats.summary.absentDays || 0}</div>
                      <div className="text-xs text-gray-600">Days Absent</div>
                    </div>
                  </Col>
                  <Col xs={12} md={6}>
                    <div className="text-center p-2 bg-white rounded border">
                      <div className="text-orange-600 font-bold text-xl">{attendanceStats.summary.lateDays || 0}</div>
                      <div className="text-xs text-gray-600">Days Late</div>
                    </div>
                  </Col>
                  <Col xs={12} md={6}>
                    <div className="text-center p-2 bg-white rounded border">
                      <div className="text-blue-600 font-bold text-xl">{attendanceStats.summary.leaveDays || 0}</div>
                      <div className="text-xs text-gray-600">Days on Leave</div>
                    </div>
                  </Col>
                  <Col xs={12} md={6}>
                    <div className="text-center p-2 bg-white rounded border">
                      <div className="text-purple-600 font-bold text-xl">
                        {Math.floor((attendanceStats.summary.totalWorkingHours || 0) / 60)}h {(attendanceStats.summary.totalWorkingHours || 0) % 60}m
                      </div>
                      <div className="text-xs text-gray-600">Total Hours</div>
                    </div>
                  </Col>
                </Row>
                <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                  💡 <strong>Tip:</strong> Use this attendance data to calculate deductions. For example: "Absent {attendanceStats.summary.absentDays} days this month" or "Late {attendanceStats.summary.lateDays} times this month"
                </div>
              </div>
            )}

            {/* No Attendance Data Message */}
            {selectedEmployee && attendanceStats && !attendanceStats.summary && (
              <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500 text-sm">
                ℹ️ No attendance summary available for {dayjs().month(selectedMonth - 1).format('MMMM')} {selectedYear}
              </div>
            )}

            <Form form={deductionForm} layout="vertical">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Deduction Amount"
                    name="amount"
                    rules={[{ required: true, message: 'Please enter deduction amount' }]}
                  >
                    <InputNumber
                      prefix="$"
                      style={{ width: '100%' }}
                      size="large"
                      min={0}
                      placeholder="Enter amount"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Applied To">
                    <Input 
                      size="large"
                      value={`${dayjs().month(selectedMonth - 1).format('MMMM')} ${selectedYear}`}
                      disabled
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                label="Reason"
                name="reason"
                rules={[{ required: true, message: 'Please enter reason' }]}
              >
                <TextArea
                  rows={3}
                  placeholder="e.g., Absent 3 days this month, Late 5 times this month, Damage penalty, Loan repayment"
                  size="large"
                />
              </Form.Item>

              {/* Quick Fill Buttons for Attendance-Based Deductions */}
              {attendanceStats?.summary && (attendanceStats.summary.absentDays > 0 || attendanceStats.summary.lateDays > 0 || attendanceStats.summary.leaveDays > 0) && (
                <div className="mb-4">
                  <div className="text-xs text-gray-600 mb-2">Quick Fill Reason:</div>
                  <Space wrap>
                    {attendanceStats.summary.absentDays > 0 && (
                      <Button
                        size="small"
                        onClick={() => deductionForm.setFieldsValue({ 
                          reason: `Deduction for ${attendanceStats.summary.absentDays} days absent in ${dayjs().month(selectedMonth - 1).format('MMMM')} ${selectedYear}` 
                        })}
                      >
                        📅 Absent ({attendanceStats.summary.absentDays} days)
                      </Button>
                    )}
                    {attendanceStats.summary.lateDays > 0 && (
                      <Button
                        size="small"
                        onClick={() => deductionForm.setFieldsValue({ 
                          reason: `Deduction for late arrival ${attendanceStats.summary.lateDays} times in ${dayjs().month(selectedMonth - 1).format('MMMM')} ${selectedYear}` 
                        })}
                      >
                        ⏰ Late ({attendanceStats.summary.lateDays} times)
                      </Button>
                    )}
                    {attendanceStats.summary.leaveDays > 0 && (
                      <Button
                        size="small"
                        onClick={() => deductionForm.setFieldsValue({ 
                          reason: `Deduction for ${attendanceStats.summary.leaveDays} days leave/permission in ${dayjs().month(selectedMonth - 1).format('MMMM')} ${selectedYear}` 
                        })}
                      >
                        🏖️ Leave ({attendanceStats.summary.leaveDays} days)
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
                Add Deduction
              </Button>
            </Form>
          </TabPane>

          {/* Overtime Tab */}
          <TabPane
            tab={
              <span className="flex items-center gap-2">
                <ClockCircleOutlined />
                Overtime
              </span>
            }
            key="overtime"
          >
            <Form form={overtimeForm} layout="vertical">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Date"
                    name="date"
                    rules={[{ required: true, message: 'Please select date' }]}
                  >
                    <DatePicker
                      style={{ width: '100%' }}
                      size="large"
                      format="YYYY-MM-DD"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Amount"
                    name="amount"
                    rules={[{ required: true, message: 'Please enter amount' }]}
                  >
                    <InputNumber
                      prefix="$"
                      style={{ width: '100%' }}
                      size="large"
                      min={0}
                      placeholder="Enter overtime payment amount"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Notes (Optional)" name="notes">
                <TextArea
                  rows={2}
                  placeholder="Additional notes about overtime work"
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
                Record Overtime
              </Button>
            </Form>
          </TabPane>

          {/* Raise Salary Tab */}
          <TabPane
            tab={
              <span className="flex items-center gap-2">
                <RiseOutlined />
                Raise Base Salary
              </span>
            }
            key="raise"
          >
            <Form form={salaryForm} layout="vertical">
              <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-500 rounded">
                <Text type="warning" className="font-semibold">
                  ⚠️ Important: Raising base salary affects all future months
                </Text>
                <p className="text-sm text-gray-600 mt-2">
                  This change will update the employee's base salary permanently and will be reflected in all future salary calculations.
                </p>
              </div>

              {selectedEmployeeData && (
                <div className="mb-4 p-4 bg-gray-50 rounded">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text type="secondary" className="text-xs">Current Base Salary</Text>
                      <div className="text-2xl font-bold text-gray-700">
                        ${parseFloat(selectedEmployeeData.baseSalary || 0).toLocaleString()}
                      </div>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary" className="text-xs">Employee</Text>
                      <div className="font-semibold text-lg">
                        {selectedEmployeeData.fullName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {selectedEmployeeData.employeeCode} - {selectedEmployeeData.department}
                      </div>
                    </Col>
                  </Row>
                </div>
              )}

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="New Base Salary"
                    name="newBaseSalary"
                    rules={[
                      { required: true, message: 'Please enter new base salary' },
                      { 
                        type: 'number', 
                        min: 0, 
                        message: 'Salary must be positive' 
                      }
                    ]}
                  >
                    <InputNumber
                      prefix="$"
                      style={{ width: '100%' }}
                      size="large"
                      min={0}
                      placeholder="Enter new base salary"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Effective Date">
                    <Input 
                      size="large"
                      value="Immediate"
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
                Update Base Salary
              </Button>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
    </DashboardLayout>
  )
}
