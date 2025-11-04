'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Card, 
  Button, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  message, 
  Space,
  Row,
  Col,
  Divider,
  Table,
  Tag,
  Tooltip,
  Alert,
  Spin
} from 'antd'
import {
  DollarOutlined,
  PlusOutlined,
  GiftOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
  BankOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import apiClient from '@/lib/api'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

const { Option } = Select
const { TextArea } = Input

interface Employee {
  id: number
  firstName: string
  lastName: string
  employeeCode: string
  department: string
  baseSalary: string
}

interface SalaryComponent {
  id: number
  employeeId: number
  employeeName: string
  employeeCode: string
  type: 'bonus' | 'deduction' | 'overtime'
  amount: string
  reason: string
  month: number
  year: number
  createdAt: string
}

interface ManageSalaryProps {
  role: 'ROLE_ADMIN' | 'ROLE_MANAGER'
}

export default function ManageSalaryPage({ role }: ManageSalaryProps) {
  const queryClient = useQueryClient()
  const [bonusForm] = Form.useForm()
  const [deductionForm] = Form.useForm()
  const [overtimeForm] = Form.useForm()

  const currentDate = dayjs()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.month() + 1)
  const [selectedYear, setSelectedYear] = useState(currentDate.year())
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'bonus' | 'deduction' | 'overtime'>('bonus')

  const isAdmin = role === 'ROLE_ADMIN'

  // Fetch departments (admin only)
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiClient.getDepartments(),
    enabled: isAdmin
  })

  const departments = Array.isArray(departmentsData) ? departmentsData : []

  // Fetch employees
  const { data: employeesData, isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees', role],
    queryFn: async () => {
      const response = await apiClient.getUsers(1, 1000)
      return response
    }
  })

  const allEmployees: Employee[] = employeesData?.users || []
  
  // Filter employees by department if selected (only show active employees)
  const employees = allEmployees
    .filter(emp => {
      if (!emp) return false
      // Filter by department if selected
      if (selectedDepartment && emp.department !== selectedDepartment) return false
      return true
    })

  // Fetch employee salary details
  const { data: employeeDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ['employee-salary', selectedEmployeeId, selectedMonth, selectedYear],
    queryFn: () => apiClient.getEmployeeSalaryDetails({
      employeeId: selectedEmployeeId!,
      month: selectedMonth,
      year: selectedYear,
      role
    }),
    enabled: !!selectedEmployeeId
  })

  // Fetch recent salary components
  const { data: componentsData, refetch: refetchComponents } = useQuery({
    queryKey: ['salary-components', selectedMonth, selectedYear, role],
    queryFn: () => apiClient.getSalaryComponents()
  })

  const components: SalaryComponent[] = componentsData?.components || []

  // Add bonus mutation
  const bonusMutation = useMutation({
    mutationFn: (values: any) => apiClient.addBonus(values),
    onSuccess: () => {
      message.success('Bonus added successfully!')
      bonusForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['salary-components'] })
      queryClient.invalidateQueries({ queryKey: ['employee-salary'] })
      refetchComponents()
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
      queryClient.invalidateQueries({ queryKey: ['salary-components'] })
      queryClient.invalidateQueries({ queryKey: ['employee-salary'] })
      refetchComponents()
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to add deduction')
    }
  })

  // Add overtime mutation
  const overtimeMutation = useMutation({
    mutationFn: async (values: any) => {
      // Use addBonus endpoint for overtime with direct amount
      return apiClient.addBonus({
        employeeId: values.employeeId,
        amount: values.amount,
        reason: `Overtime: ${values.description}`,
        month: selectedMonth,
        year: selectedYear
      })
    },
    onSuccess: () => {
      message.success('Overtime added successfully!')
      overtimeForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['salary-components'] })
      queryClient.invalidateQueries({ queryKey: ['employee-salary'] })
      refetchComponents()
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to add overtime')
    }
  })

  const handleAddBonus = () => {
    bonusForm.validateFields().then(values => {
      bonusMutation.mutate({
        ...values,
        month: selectedMonth,
        year: selectedYear
      })
    })
  }

  const handleAddDeduction = () => {
    deductionForm.validateFields().then(values => {
      deductionMutation.mutate({
        ...values,
        month: selectedMonth,
        year: selectedYear
      })
    })
  }

  const handleAddOvertime = () => {
    overtimeForm.validateFields().then(values => {
      overtimeMutation.mutate({
        ...values,
        month: selectedMonth,
        year: selectedYear
      })
    })
  }

  const getTypeTag = (type: string) => {
    const config = {
      bonus: { color: 'success', icon: <GiftOutlined />, label: 'Bonus' },
      deduction: { color: 'error', icon: <WarningOutlined />, label: 'Deduction' },
      overtime: { color: 'processing', icon: <ClockCircleOutlined />, label: 'Overtime' }
    }
    const c = config[type as keyof typeof config] || config.bonus
    return <Tag icon={c.icon} color={c.color}>{c.label}</Tag>
  }

  const columns: ColumnsType<SalaryComponent> = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 100,
      render: (value) => dayjs(value).format('MMM D')
    },
    {
      title: 'Employee',
      key: 'employee',
      width: 150,
      render: (_, record) => (
        <div>
          <div className="font-medium text-sm">{record.employeeName}</div>
          <div className="text-xs text-gray-500">{record.employeeCode}</div>
        </div>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => getTypeTag(type)
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      align: 'right',
      render: (value, record) => {
        const amount = parseFloat(value)
        const color = record.type === 'deduction' ? 'text-red-600' : 'text-green-600'
        const sign = record.type === 'deduction' ? '-' : '+'
        return (
          <span className={`font-semibold ${color}`}>
            {sign}${amount.toLocaleString()}
          </span>
        )
      }
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span className="text-sm">{text}</span>
        </Tooltip>
      )
    }
  ]

  return (
    <DashboardLayout role={role}>
      <div className="p-4 max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">⚙️ Manage Salary</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Add bonuses, deductions, and overtime for employees
          </p>
        </div>

        {/* Period & Department Selection */}
        <Card className="mb-6 shadow-sm">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">
                  <CalendarOutlined /> Period:
                </span>
                <Select
                  value={selectedMonth}
                  onChange={setSelectedMonth}
                  style={{ width: 140 }}
                  size="large"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <Option key={month} value={month}>
                      {dayjs().month(month - 1).format('MMMM')}
                    </Option>
                  ))}
                </Select>
                <Select
                  value={selectedYear}
                  onChange={setSelectedYear}
                  style={{ width: 100 }}
                  size="large"
                >
                  {Array.from({ length: 5 }, (_, i) => currentDate.year() - i).map(year => (
                    <Option key={year} value={year}>{year}</Option>
                  ))}
                </Select>
              </div>
            </Col>
            
            {isAdmin && departments.length > 0 && (
              <Col xs={24} md={12}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    <BankOutlined /> Department:
                  </span>
                  <Select
                    value={selectedDepartment}
                    onChange={setSelectedDepartment}
                    style={{ width: '100%', maxWidth: 250 }}
                    placeholder="All Departments"
                    allowClear
                    size="large"
                  >
                    {departments.map((dept: any) => (
                      <Option key={dept.id} value={dept.departmentName || dept.name}>
                        {dept.departmentName || dept.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
            )}
          </Row>
        </Card>

        <Row gutter={[16, 16]}>
          {/* Left Column - Actions */}
          <Col xs={24} lg={14}>
            {/* Employee Selection */}
            <Card className="mb-4 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <UserOutlined /> Select Employee
                </h3>
                {loadingEmployees ? (
                  <Spin />
                ) : (
                  <Select
                    showSearch
                    placeholder="Choose an employee"
                    style={{ width: '100%' }}
                    size="large"
                    value={selectedEmployeeId}
                    onChange={setSelectedEmployeeId}
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={employees.map(emp => ({
                      value: emp.id,
                      label: `${emp.firstName} ${emp.lastName} (${emp.employeeCode}) - ${emp.department}`
                    }))}
                  />
                )}
              </div>

              {selectedEmployeeId && employeeDetails && !loadingDetails && (
                <Alert
                  message={<strong>Current Salary Information</strong>}
                  description={
                    <div className="mt-2">
                      <div className="flex justify-between py-1 border-b">
                        <span>Base Salary:</span>
                        <span className="font-semibold">
                          ${parseFloat(employeeDetails.baseSalary || '0').toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span>Total Bonuses:</span>
                        <span className="font-semibold text-green-600">
                          +${parseFloat(employeeDetails.totalBonuses || '0').toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span>Total Deductions:</span>
                        <span className="font-semibold text-red-600">
                          -${parseFloat(employeeDetails.totalDeductions || '0').toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span>Overtime Pay:</span>
                        <span className="font-semibold text-blue-600">
                          +${parseFloat(employeeDetails.overtimePay || '0').toLocaleString()}
                        </span>
                      </div>
                      <Divider className="my-2" />
                      <div className="flex justify-between py-1">
                        <span className="font-bold text-lg">Final Salary:</span>
                        <span className="font-bold text-xl text-emerald-600">
                          ${parseFloat(employeeDetails.netSalary || '0').toLocaleString()}
                        </span>
                      </div>
                    </div>
                  }
                  type="info"
                  showIcon
                />
              )}
            </Card>

            {/* Action Buttons */}
            <Row gutter={[16, 16]} className="mb-4">
              <Col xs={24} sm={8}>
                <Button
                  type={activeTab === 'bonus' ? 'primary' : 'default'}
                  icon={<GiftOutlined />}
                  block
                  size="large"
                  onClick={() => setActiveTab('bonus')}
                  className="h-12"
                >
                  Add Bonus
                </Button>
              </Col>
              <Col xs={24} sm={8}>
                <Button
                  type={activeTab === 'deduction' ? 'primary' : 'default'}
                  icon={<WarningOutlined />}
                  block
                  size="large"
                  danger={activeTab === 'deduction'}
                  onClick={() => setActiveTab('deduction')}
                  className="h-12"
                >
                  Add Deduction
                </Button>
              </Col>
              <Col xs={24} sm={8}>
                <Button
                  type={activeTab === 'overtime' ? 'primary' : 'default'}
                  icon={<ClockCircleOutlined />}
                  block
                  size="large"
                  onClick={() => setActiveTab('overtime')}
                  className="h-12"
                >
                  Add Overtime
                </Button>
              </Col>
            </Row>

            {/* Forms */}
            {activeTab === 'bonus' && (
              <Card title={<><GiftOutlined className="mr-2" /> Add Bonus</>} className="shadow-sm">
                <Form form={bonusForm} layout="vertical">
                  <Form.Item
                    label="Employee"
                    name="employeeId"
                    rules={[{ required: true, message: 'Please select employee' }]}
                    initialValue={selectedEmployeeId}
                  >
                    <Select
                      showSearch
                      placeholder="Select employee"
                      size="large"
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      options={employees.map(emp => ({
                        value: emp.id,
                        label: `${emp.firstName} ${emp.lastName} (${emp.employeeCode})`
                      }))}
                    />
                  </Form.Item>
                  <Form.Item
                    label="Amount"
                    name="amount"
                    rules={[{ required: true, message: 'Please enter amount' }]}
                  >
                    <InputNumber
                      prefix="$"
                      style={{ width: '100%' }}
                      min={0}
                      placeholder="Enter bonus amount"
                      size="large"
                    />
                  </Form.Item>
                  <Form.Item
                    label="Reason"
                    name="reason"
                    rules={[{ required: true, message: 'Please enter reason' }]}
                  >
                    <TextArea
                      rows={3}
                      placeholder="e.g., Performance bonus, Achievement award, Project completion"
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      block
                      size="large"
                      onClick={handleAddBonus}
                      loading={bonusMutation.isPending}
                    >
                      Add Bonus
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            )}

            {activeTab === 'deduction' && (
              <Card title={<><WarningOutlined className="mr-2" /> Add Deduction</>} className="shadow-sm">
                <Form form={deductionForm} layout="vertical">
                  <Form.Item
                    label="Employee"
                    name="employeeId"
                    rules={[{ required: true, message: 'Please select employee' }]}
                    initialValue={selectedEmployeeId}
                  >
                    <Select
                      showSearch
                      placeholder="Select employee"
                      size="large"
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      options={employees.map(emp => ({
                        value: emp.id,
                        label: `${emp.firstName} ${emp.lastName} (${emp.employeeCode})`
                      }))}
                    />
                  </Form.Item>
                  <Form.Item
                    label="Amount"
                    name="amount"
                    rules={[{ required: true, message: 'Please enter amount' }]}
                  >
                    <InputNumber
                      prefix="$"
                      style={{ width: '100%' }}
                      min={0}
                      placeholder="Enter deduction amount"
                      size="large"
                    />
                  </Form.Item>
                  <Form.Item
                    label="Reason"
                    name="reason"
                    rules={[{ required: true, message: 'Please enter reason' }]}
                  >
                    <TextArea
                      rows={3}
                      placeholder="e.g., Damage penalty, Loan repayment, Advance deduction"
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button
                      type="primary"
                      danger
                      icon={<PlusOutlined />}
                      block
                      size="large"
                      onClick={handleAddDeduction}
                      loading={deductionMutation.isPending}
                    >
                      Add Deduction
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            )}

            {activeTab === 'overtime' && (
              <Card title={<><ClockCircleOutlined className="mr-2" /> Add Overtime</>} className="shadow-sm">
                <Form form={overtimeForm} layout="vertical">
                  <Form.Item
                    label="Employee"
                    name="employeeId"
                    rules={[{ required: true, message: 'Please select employee' }]}
                    initialValue={selectedEmployeeId}
                  >
                    <Select
                      showSearch
                      placeholder="Select employee"
                      size="large"
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      options={employees.map(emp => ({
                        value: emp.id,
                        label: `${emp.firstName} ${emp.lastName} (${emp.employeeCode})`
                      }))}
                    />
                  </Form.Item>
                  <Form.Item
                    label="Amount"
                    name="amount"
                    rules={[{ required: true, message: 'Please enter amount' }]}
                  >
                    <InputNumber
                      prefix="$"
                      style={{ width: '100%' }}
                      min={0}
                      placeholder="Enter overtime payment amount"
                      size="large"
                    />
                  </Form.Item>
                  <Form.Item
                    label="Description"
                    name="description"
                    rules={[{ required: true, message: 'Please enter description' }]}
                  >
                    <TextArea
                      rows={3}
                      placeholder="e.g., Weekend work, Holiday work, Project deadline"
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      block
                      size="large"
                      onClick={handleAddOvertime}
                      loading={overtimeMutation.isPending}
                    >
                      Add Overtime
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            )}
          </Col>

          {/* Right Column - Recent Activities */}
          <Col xs={24} lg={10}>
            <Card 
              title={<><FileTextOutlined className="mr-2" /> Recent Activities</>}
              className="shadow-sm"
            >
              <div className="overflow-x-auto">
                <Table
                  columns={columns}
                  dataSource={components.slice(0, 15)}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  scroll={{ y: 500 }}
                />
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </DashboardLayout>
  )
}
