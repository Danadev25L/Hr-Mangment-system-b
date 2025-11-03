'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  DatePicker, 
  message, 
  Tag, 
  Space,
  Card,
  Statistic,
  Tabs,
  Descriptions,
  Divider,
  Row,
  Col,
  Badge,
  Tooltip,
  Empty
} from 'antd'
import {
  DollarOutlined,
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  CalculatorOutlined,
  GiftOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  SettingOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import apiClient from '@/lib/api'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

const { TabPane } = Tabs
const { Option } = Select

interface SalaryRecord {
  id: number
  employeeId: number
  employeeName: string
  employeeCode: string
  department: string
  month: number
  year: number
  baseSalary: string
  totalBonuses: string
  totalAllowances: string
  overtimePay: string
  totalDeductions: string
  absenceDeductions: string
  latencyDeductions: string
  taxDeduction: string
  grossSalary: string
  netSalary: string
  status: 'draft' | 'calculated' | 'approved' | 'paid'
  calculatedAt: string
  approvedAt?: string
  paidAt?: string
}

interface SalarySummary {
  totalEmployees: number
  totalGrossSalary: number
  totalNetSalary: number
  totalDeductions: number
  totalBonuses: number
  statusBreakdown: {
    draft: number
    calculated: number
    approved: number
    paid: number
  }
}

interface SalaryManagementProps {
  role: 'ROLE_ADMIN' | 'ROLE_MANAGER'
}

export default function SalaryManagementPage({ role }: SalaryManagementProps) {
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [bonusForm] = Form.useForm()
  const [deductionForm] = Form.useForm()

  const currentDate = dayjs()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.month() + 1)
  const [selectedYear, setSelectedYear] = useState(currentDate.year())
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  
  const [detailsModal, setDetailsModal] = useState(false)
  const [bonusModal, setBonusModal] = useState(false)
  const [deductionModal, setDeductionModal] = useState(false)
  const [calculateModal, setCalculateModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<SalaryRecord | null>(null)

  const isAdmin = role === 'ROLE_ADMIN'

  // Fetch salary records
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['salary-management', selectedMonth, selectedYear, selectedStatus, role],
    queryFn: () => apiClient.getMonthlySalaries({
      month: selectedMonth,
      year: selectedYear,
      status: selectedStatus,
      role
    })
  })

  const salaries: SalaryRecord[] = data?.salaries || []
  const summary: SalarySummary = data?.summary || {
    totalEmployees: 0,
    totalGrossSalary: 0,
    totalNetSalary: 0,
    totalDeductions: 0,
    totalBonuses: 0,
    statusBreakdown: { draft: 0, calculated: 0, approved: 0, paid: 0 }
  }

  // Calculate salaries mutation
  const calculateMutation = useMutation({
    mutationFn: (values: any) => apiClient.calculateMonthlySalaries(values),
    onSuccess: () => {
      message.success('Salaries calculated successfully!')
      setCalculateModal(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['salary-management'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to calculate salaries')
    }
  })

  // Add bonus mutation
  const bonusMutation = useMutation({
    mutationFn: (values: any) => apiClient.addBonus(values),
    onSuccess: () => {
      message.success('Bonus added successfully!')
      setBonusModal(false)
      bonusForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['salary-management'] })
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
      setDeductionModal(false)
      deductionForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['salary-management'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to add deduction')
    }
  })

  // Approve salary mutation
  const approveMutation = useMutation({
    mutationFn: (salaryId: number) => apiClient.approveSalary(salaryId),
    onSuccess: () => {
      message.success('Salary approved successfully!')
      queryClient.invalidateQueries({ queryKey: ['salary-management'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to approve salary')
    }
  })

  // Mark as paid mutation
  const paidMutation = useMutation({
    mutationFn: ({ salaryId, paymentData }: any) => 
      apiClient.markSalaryAsPaid(salaryId, paymentData),
    onSuccess: () => {
      message.success('Salary marked as paid successfully!')
      queryClient.invalidateQueries({ queryKey: ['salary-management'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to mark as paid')
    }
  })

  const handleCalculate = () => {
    form.validateFields().then(values => {
      calculateMutation.mutate(values)
    })
  }

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

  const handleViewDetails = async (record: SalaryRecord) => {
    setSelectedRecord(record)
    setDetailsModal(true)
  }

  const handleApproveSalary = (salaryId: number) => {
    Modal.confirm({
      title: 'Approve Salary?',
      content: 'Are you sure you want to approve this salary record?',
      onOk: () => approveMutation.mutate(salaryId)
    })
  }

  const handleMarkAsPaid = (salaryId: number) => {
    Modal.confirm({
      title: 'Mark as Paid',
      content: (
        <Form layout="vertical">
          <Form.Item label="Payment Method" name="paymentMethod" initialValue="bank_transfer">
            <Select>
              <Option value="bank_transfer">Bank Transfer</Option>
              <Option value="cash">Cash</Option>
              <Option value="cheque">Cheque</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Payment Reference" name="paymentReference">
            <Input placeholder="Enter payment reference" />
          </Form.Item>
        </Form>
      ),
      onOk: (close) => {
        paidMutation.mutate({
          salaryId,
          paymentData: {
            paymentMethod: 'bank_transfer',
            paymentReference: dayjs().format('PAY-YYYYMMDD-') + salaryId
          }
        })
      }
    })
  }

  const getStatusTag = (status: string) => {
    const statusConfig = {
      draft: { color: 'default', icon: <ClockCircleOutlined /> },
      calculated: { color: 'processing', icon: <CalculatorOutlined /> },
      approved: { color: 'success', icon: <CheckOutlined /> },
      paid: { color: 'success', icon: <DollarOutlined /> }
    }
    const config = statusConfig[status as keyof typeof statusConfig]
    return <Tag icon={config.icon} color={config.color}>{status.toUpperCase()}</Tag>
  }

  const columns: ColumnsType<SalaryRecord> = [
    {
      title: 'Employee',
      key: 'employee',
      fixed: 'left',
      width: 200,
      render: (_, record) => (
        <div>
          <div className="font-semibold">{record.employeeName}</div>
          <div className="text-xs text-gray-500">{record.employeeCode}</div>
          <div className="text-xs text-gray-400">{record.department}</div>
        </div>
      )
    },
    {
      title: 'Period',
      key: 'period',
      width: 120,
      render: (_, record) => (
        <div>
          <div className="font-medium">{`${record.month}/${record.year}`}</div>
        </div>
      )
    },
    {
      title: 'Base Salary',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      width: 120,
      align: 'right',
      render: (value) => `$${parseFloat(value).toLocaleString()}`
    },
    {
      title: 'Bonuses',
      dataIndex: 'totalBonuses',
      key: 'totalBonuses',
      width: 100,
      align: 'right',
      render: (value) => (
        <span className="text-green-600 font-medium">
          +${parseFloat(value).toLocaleString()}
        </span>
      )
    },
    {
      title: 'Overtime',
      dataIndex: 'overtimePay',
      key: 'overtimePay',
      width: 100,
      align: 'right',
      render: (value) => (
        <span className="text-blue-600">
          +${parseFloat(value).toLocaleString()}
        </span>
      )
    },
    {
      title: 'Deductions',
      key: 'deductions',
      width: 150,
      align: 'right',
      render: (_, record) => {
        const total = parseFloat(record.totalDeductions)
        const absence = parseFloat(record.absenceDeductions)
        const latency = parseFloat(record.latencyDeductions)
        
        return (
          <Tooltip title={
            <div>
              <div>Absence: ${absence.toFixed(2)}</div>
              <div>Latency: ${latency.toFixed(2)}</div>
              <div>Tax: ${parseFloat(record.taxDeduction).toFixed(2)}</div>
            </div>
          }>
            <span className="text-red-600 font-medium cursor-help">
              -${total.toLocaleString()}
            </span>
          </Tooltip>
        )
      }
    },
    {
      title: 'Gross Salary',
      dataIndex: 'grossSalary',
      key: 'grossSalary',
      width: 130,
      align: 'right',
      render: (value) => (
        <span className="font-semibold">
          ${parseFloat(value).toLocaleString()}
        </span>
      )
    },
    {
      title: 'Net Salary',
      dataIndex: 'netSalary',
      key: 'netSalary',
      width: 140,
      align: 'right',
      render: (value) => (
        <span className="text-lg font-bold text-green-700">
          ${parseFloat(value).toLocaleString()}
        </span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          
          {isAdmin && record.status === 'calculated' && (
            <Tooltip title="Approve">
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleApproveSalary(record.id)}
                className="text-green-600"
              />
            </Tooltip>
          )}
          
          {isAdmin && record.status === 'approved' && (
            <Tooltip title="Mark as Paid">
              <Button
                type="link"
                size="small"
                icon={<DollarOutlined />}
                onClick={() => handleMarkAsPaid(record.id)}
                className="text-blue-600"
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ]

  return (
    <DashboardLayout role={role}>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">💰 Salary Management</h1>
            <p className="text-gray-600 mt-1">
              Comprehensive salary management with bonuses, deductions, and automated calculations
            </p>
          </div>
          
          {isAdmin && (
            <Space>
              <Button
                type="primary"
                icon={<CalculatorOutlined />}
                onClick={() => setCalculateModal(true)}
                size="large"
              >
                Calculate Salaries
              </Button>
            </Space>
          )}
        </div>

        {/* Summary Cards */}
        <Row gutter={16} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Employees"
                value={summary.totalEmployees}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Gross Salary"
                value={summary.totalGrossSalary}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Net Salary"
                value={summary.totalNetSalary}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#13c2c2' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Deductions"
                value={summary.totalDeductions}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Status Breakdown */}
        <Card className="mb-6">
          <Row gutter={16}>
            <Col span={6}>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400">
                  {summary.statusBreakdown.draft}
                </div>
                <div className="text-sm text-gray-500">Draft</div>
              </div>
            </Col>
            <Col span={6}>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {summary.statusBreakdown.calculated}
                </div>
                <div className="text-sm text-gray-500">Calculated</div>
              </div>
            </Col>
            <Col span={6}>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {summary.statusBreakdown.approved}
                </div>
                <div className="text-sm text-gray-500">Approved</div>
              </div>
            </Col>
            <Col span={6}>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">
                  {summary.statusBreakdown.paid}
                </div>
                <div className="text-sm text-gray-500">Paid</div>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <Row gutter={16} align="middle">
            <Col>
              <span className="font-medium mr-2">Period:</span>
            </Col>
            <Col>
              <Select
                value={selectedMonth}
                onChange={setSelectedMonth}
                style={{ width: 120 }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <Option key={month} value={month}>
                    {dayjs().month(month - 1).format('MMMM')}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col>
              <Select
                value={selectedYear}
                onChange={setSelectedYear}
                style={{ width: 100 }}
              >
                {Array.from({ length: 5 }, (_, i) => currentDate.year() - i).map(year => (
                  <Option key={year} value={year}>{year}</Option>
                ))}
              </Select>
            </Col>
            <Col>
              <Select
                value={selectedStatus}
                onChange={setSelectedStatus}
                style={{ width: 150 }}
                placeholder="All Status"
                allowClear
              >
                <Option value="draft">Draft</Option>
                <Option value="calculated">Calculated</Option>
                <Option value="approved">Approved</Option>
                <Option value="paid">Paid</Option>
              </Select>
            </Col>
            <Col flex="auto" className="text-right">
              {isAdmin && (
                <Space>
                  <Button
                    icon={<GiftOutlined />}
                    onClick={() => setBonusModal(true)}
                  >
                    Add Bonus
                  </Button>
                  <Button
                    icon={<WarningOutlined />}
                    onClick={() => setDeductionModal(true)}
                    danger
                  >
                    Add Deduction
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => refetch()}
                  >
                    Refresh
                  </Button>
                </Space>
              )}
            </Col>
          </Row>
        </Card>

        {/* Salary Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={salaries}
            rowKey="id"
            loading={isLoading}
            scroll={{ x: 1500 }}
            pagination={{
              pageSize: 20,
              showTotal: (total) => `Total ${total} records`,
              showSizeChanger: true
            }}
          />
        </Card>

        {/* Calculate Modal */}
        <Modal
          title="Calculate Monthly Salaries"
          open={calculateModal}
          onOk={handleCalculate}
          onCancel={() => setCalculateModal(false)}
          confirmLoading={calculateMutation.isPending}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label="Month"
              name="month"
              initialValue={selectedMonth}
              rules={[{ required: true }]}
            >
              <Select>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <Option key={month} value={month}>
                    {dayjs().month(month - 1).format('MMMM')}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="Year"
              name="year"
              initialValue={selectedYear}
              rules={[{ required: true }]}
            >
              <Select>
                {Array.from({ length: 5 }, (_, i) => currentDate.year() - i).map(year => (
                  <Option key={year} value={year}>{year}</Option>
                ))}
              </Select>
            </Form.Item>
            <div className="p-4 bg-blue-50 rounded">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This will calculate salaries for all employees based on:
              </p>
              <ul className="text-sm text-blue-700 mt-2 list-disc list-inside">
                <li>Base salary</li>
                <li>Approved overtime</li>
                <li>Bonuses and allowances</li>
                <li>Attendance-based deductions (absences, lateness)</li>
                <li>Tax calculations</li>
              </ul>
            </div>
          </Form>
        </Modal>

        {/* Bonus Modal */}
        <Modal
          title="Add Bonus"
          open={bonusModal}
          onOk={handleAddBonus}
          onCancel={() => setBonusModal(false)}
          confirmLoading={bonusMutation.isPending}
        >
          <Form form={bonusForm} layout="vertical">
            <Form.Item
              label="Employee"
              name="employeeId"
              rules={[{ required: true, message: 'Please select employee' }]}
            >
              <Select
                showSearch
                placeholder="Select employee"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={salaries.map(s => ({
                  value: s.employeeId,
                  label: `${s.employeeName} (${s.employeeCode})`
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
              />
            </Form.Item>
            <Form.Item
              label="Reason"
              name="reason"
              rules={[{ required: true, message: 'Please enter reason' }]}
            >
              <Input.TextArea
                rows={3}
                placeholder="Enter reason for bonus (e.g., Performance bonus, Achievement award)"
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* Deduction Modal */}
        <Modal
          title="Add Deduction"
          open={deductionModal}
          onOk={handleAddDeduction}
          onCancel={() => setDeductionModal(false)}
          confirmLoading={deductionMutation.isPending}
        >
          <Form form={deductionForm} layout="vertical">
            <Form.Item
              label="Employee"
              name="employeeId"
              rules={[{ required: true, message: 'Please select employee' }]}
            >
              <Select
                showSearch
                placeholder="Select employee"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={salaries.map(s => ({
                  value: s.employeeId,
                  label: `${s.employeeName} (${s.employeeCode})`
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
              />
            </Form.Item>
            <Form.Item
              label="Reason"
              name="reason"
              rules={[{ required: true, message: 'Please enter reason' }]}
            >
              <Input.TextArea
                rows={3}
                placeholder="Enter reason for deduction (e.g., Damage penalty, Loan repayment)"
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* Details Modal */}
        <Modal
          title={`Salary Details - ${selectedRecord?.employeeName}`}
          open={detailsModal}
          onCancel={() => setDetailsModal(false)}
          width={800}
          footer={null}
        >
          {selectedRecord && (
            <div>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Employee Code">
                  {selectedRecord.employeeCode}
                </Descriptions.Item>
                <Descriptions.Item label="Department">
                  {selectedRecord.department}
                </Descriptions.Item>
                <Descriptions.Item label="Period">
                  {selectedRecord.month}/{selectedRecord.year}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  {getStatusTag(selectedRecord.status)}
                </Descriptions.Item>
              </Descriptions>

              <Divider>Earnings</Divider>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Base Salary">
                  ${parseFloat(selectedRecord.baseSalary).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Bonuses">
                  <span className="text-green-600">
                    +${parseFloat(selectedRecord.totalBonuses).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Allowances">
                  <span className="text-green-600">
                    +${parseFloat(selectedRecord.totalAllowances).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Overtime Pay">
                  <span className="text-blue-600">
                    +${parseFloat(selectedRecord.overtimePay).toLocaleString()}
                  </span>
                </Descriptions.Item>
              </Descriptions>

              <Divider>Deductions</Divider>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Absence Deductions">
                  <span className="text-red-600">
                    -${parseFloat(selectedRecord.absenceDeductions).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Latency Deductions">
                  <span className="text-orange-600">
                    -${parseFloat(selectedRecord.latencyDeductions).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Tax Deduction">
                  <span className="text-red-600">
                    -${parseFloat(selectedRecord.taxDeduction).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Total Deductions">
                  <span className="text-red-600 font-bold">
                    -${parseFloat(selectedRecord.totalDeductions).toLocaleString()}
                  </span>
                </Descriptions.Item>
              </Descriptions>

              <Divider>Final Amount</Divider>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Gross Salary">
                  <span className="text-lg font-semibold">
                    ${parseFloat(selectedRecord.grossSalary).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Net Salary">
                  <span className="text-xl font-bold text-green-700">
                    ${parseFloat(selectedRecord.netSalary).toLocaleString()}
                  </span>
                </Descriptions.Item>
              </Descriptions>

              {selectedRecord.calculatedAt && (
                <div className="mt-4 text-sm text-gray-500">
                  <p>Calculated: {dayjs(selectedRecord.calculatedAt).format('MMMM D, YYYY h:mm A')}</p>
                  {selectedRecord.approvedAt && (
                    <p>Approved: {dayjs(selectedRecord.approvedAt).format('MMMM D, YYYY h:mm A')}</p>
                  )}
                  {selectedRecord.paidAt && (
                    <p>Paid: {dayjs(selectedRecord.paidAt).format('MMMM D, YYYY h:mm A')}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  )
}
