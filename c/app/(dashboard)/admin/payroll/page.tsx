'use client';

import { useAuthGuard } from '@/src/middleware/auth';
import {
  Card,
  Table,
  Space,
  Tag,
  Select,
  Statistic,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Tabs,
  Progress,
  Avatar,
  Badge,
  Dropdown,
  message,
  Tooltip,
  Spin,
  Empty
} from 'antd';
import {
  DollarOutlined,
  UserOutlined,
  CalendarOutlined,
  LineChartOutlined,
  PrinterOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  RiseOutlined,
  ThunderboltOutlined,
  FileExcelOutlined,
  FilterOutlined,
  SearchOutlined,
  ReloadOutlined,
  SettingOutlined,
  BarChartOutlined,
  PieChartOutlined,
  TeamOutlined,
  MoneyCollectOutlined,
  CalculatorOutlined,
  GiftOutlined
} from '@ant-design/icons';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/src/lib/api';
import dayjs from 'dayjs';

const { TabPane } = Tabs;

interface PayrollRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  department: string;
  baseSalary: number;
  overtimeHours: number;
  overtimePay: number;
  bonuses: number;
  adjustments: number;
  grossSalary: number;
  taxDeduction: number;
  netSalary: number;
  status: string;
  month: number;
  year: number;
  createdAt: string;
  approvedAt?: string;
  paidAt?: string;
}

interface PaymentRecord {
  id: number;
  userId: number;
  amount: number;
  type: string;
  date: string;
  description: string;
}

interface PayrollStats {
  totalEmployees: number;
  totalPayroll: number;
  averagePay: number;
  pendingApprovals: number;
  paidThisMonth: number;
  bonusesGiven: number;
  overtimeHours: number;
}

export default function AdminPayrollPage() {
  const { isAuthenticated, loading } = useAuthGuard('admin');

  // State management
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [stats, setStats] = useState<PayrollStats>({
    totalEmployees: 0,
    totalPayroll: 0,
    averagePay: 0,
    pendingApprovals: 0,
    paidThisMonth: 0,
    bonusesGiven: 0,
    overtimeHours: 0
  });

  const [loadingData, setLoadingData] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchText, setSearchText] = useState('');

  // Modal states
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [bonusModalVisible, setBonusModalVisible] = useState(false);
  const [raiseModalVisible, setRaiseModalVisible] = useState(false);
  const [adjustmentModalVisible, setAdjustmentModalVisible] = useState(false);

  // Form refs
  const [generateForm] = Form.useForm();
  const [bonusForm] = Form.useForm();
  const [raiseForm] = Form.useForm();
  const [adjustmentForm] = Form.useForm();

  // Fetch payroll data
  const fetchPayrollData = useCallback(async () => {
    try {
      setLoadingData(true);
      const response = await api.get('/api/admin/payroll', {
        params: {
          month: selectedMonth,
          year: selectedYear
        }
      });
      setPayrollRecords(response.data || []);
      calculateStats(response.data || []);
    } catch (error) {
      console.error('Error fetching payroll:', error);
      message.error('Failed to fetch payroll data');
    } finally {
      setLoadingData(false);
    }
  }, [selectedMonth, selectedYear]);

  // Fetch payment data
  const fetchPaymentData = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/payments', {
        params: { year: selectedYear }
      });
      setPaymentRecords(response.data || []);
    } catch {
      console.error('Error fetching payments');
    }
  }, [selectedYear]);

  // Calculate statistics
  const calculateStats = (records: PayrollRecord[]) => {
    const totalPayroll = records.reduce((sum, record) => sum + record.netSalary, 0);
    const averagePay = records.length > 0 ? totalPayroll / records.length : 0;
    const pendingApprovals = records.filter(r => r.status === 'pending').length;
    const paidThisMonth = records.filter(r => r.status === 'paid').length;
    const bonusesGiven = records.reduce((sum, record) => sum + record.bonuses, 0);
    const overtimeHours = records.reduce((sum, record) => sum + record.overtimeHours, 0);

    setStats({
      totalEmployees: records.length,
      totalPayroll,
      averagePay,
      pendingApprovals,
      paidThisMonth,
      bonusesGiven,
      overtimeHours
    });
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPayrollData();
      fetchPaymentData();
    }
  }, [isAuthenticated, fetchPayrollData, fetchPaymentData]);

  // Generate monthly payroll
  const handleGeneratePayroll = async (values: { month: number; year: number; departmentId?: number }) => {
    try {
      const response = await api.post('/api/admin/payroll', {
        month: values.month,
        year: values.year,
        departmentId: values.departmentId || null
      });

      if (response.status === 200) {
        message.success('Payroll generated successfully!');
        setGenerateModalVisible(false);
        generateForm.resetFields();
        fetchPayrollData();
      }
    } catch {
      console.error('Error generating payroll');
      message.error('Failed to generate payroll');
    }
  };

  // Approve payroll
  const handleApprovePayroll = async (recordId: number) => {
    try {
      await api.put(`/api/admin/payroll/${recordId}`, { action: 'approve' });
      message.success('Payroll approved successfully!');
      fetchPayrollData();
    } catch (error) {
      message.error('Failed to approve payroll');
    }
  };

  // Mark as paid
  const handleMarkAsPaid = async (recordId: number) => {
    try {
      await api.put(`/api/admin/payroll/${recordId}`, { action: 'paid' });
      message.success('Payroll marked as paid!');
      fetchPayrollData();
    } catch (error) {
      message.error('Failed to mark payroll as paid');
    }
  };

  // Export to Excel (placeholder - would need xlsx package)
  const exportToExcel = () => {
    // For now, just show a message. In production, install xlsx package
    const csvContent = [
      ['Employee ID', 'Employee Name', 'Department', 'Base Salary', 'Overtime Hours', 'Overtime Pay', 'Bonuses', 'Adjustments', 'Gross Salary', 'Tax Deduction', 'Net Salary', 'Status', 'Month', 'Year'],
      ...payrollRecords.map(record => [
        record.employeeId,
        record.employeeName,
        record.department,
        record.baseSalary,
        record.overtimeHours,
        record.overtimePay,
        record.bonuses,
        record.adjustments,
        record.grossSalary,
        record.taxDeduction,
        record.netSalary,
        record.status,
        record.month,
        record.year
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payroll-${selectedMonth}-${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('Payroll exported to CSV!');
  };

  // Print report
  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Payroll Report - ${dayjs().month(selectedMonth - 1).format('MMMM')} ${selectedYear}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .stats { display: flex; justify-content: space-around; margin-bottom: 30px; }
              .stat { text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .total { font-weight: bold; background-color: #e6f7ff; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Payroll Report</h1>
              <h2>${dayjs().month(selectedMonth - 1).format('MMMM')} ${selectedYear}</h2>
            </div>
            <div class="stats">
              <div class="stat">
                <h3>Total Employees</h3>
                <p>${stats.totalEmployees}</p>
              </div>
              <div class="stat">
                <h3>Total Payroll</h3>
                <p>$${stats.totalPayroll.toLocaleString()}</p>
              </div>
              <div class="stat">
                <h3>Average Pay</h3>
                <p>$${stats.averagePay.toFixed(2)}</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Base Salary</th>
                  <th>Overtime</th>
                  <th>Bonuses</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${payrollRecords.map(record => `
                  <tr>
                    <td>${record.employeeName}</td>
                    <td>${record.department}</td>
                    <td>$${record.baseSalary.toLocaleString()}</td>
                    <td>$${record.overtimePay.toLocaleString()}</td>
                    <td>$${record.bonuses.toLocaleString()}</td>
                    <td>$${record.netSalary.toLocaleString()}</td>
                    <td>${record.status}</td>
                  </tr>
                `).join('')}
                <tr class="total">
                  <td colspan="5"><strong>TOTAL</strong></td>
                  <td><strong>$${stats.totalPayroll.toLocaleString()}</strong></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Filter records
  const filteredRecords = payrollRecords.filter(record => {
    const matchesDepartment = selectedDepartment === 'all' || record.department === selectedDepartment;
    const matchesStatus = selectedStatus === 'all' || record.status === selectedStatus;
    const matchesSearch = !searchText ||
      record.employeeName.toLowerCase().includes(searchText.toLowerCase()) ||
      record.department.toLowerCase().includes(searchText.toLowerCase());

    return matchesDepartment && matchesStatus && matchesSearch;
  });

  // Table columns
  const columns = [
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      key: 'employeeName',
      render: (name: string, record: PayrollRecord) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1890ff' }}>
            {name.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div className="font-bold">{name}</div>
            <div className="text-xs text-gray-500">ID: {record.employeeId}</div>
          </div>
        </Space>
      ),
      width: 200
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (dept: string) => (
        <Tag color="blue">{dept || 'Unassigned'}</Tag>
      )
    },
    {
      title: 'Base Salary',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      render: (amount: number) => (
        <span className="font-bold text-green-600">
          ${amount.toLocaleString()}
        </span>
      ),
      sorter: (a: PayrollRecord, b: PayrollRecord) => a.baseSalary - b.baseSalary
    },
    {
      title: 'Overtime',
      key: 'overtime',
      render: (record: PayrollRecord) => (
        <div>
          <div>{record.overtimeHours}h</div>
          <div className="text-xs text-gray-500">
            ${record.overtimePay.toLocaleString()}
          </div>
        </div>
      )
    },
    {
      title: 'Bonuses',
      dataIndex: 'bonuses',
      key: 'bonuses',
      render: (amount: number) => (
        <span className="text-yellow-600 font-bold">
          ${amount.toLocaleString()}
        </span>
      )
    },
    {
      title: 'Net Salary',
      dataIndex: 'netSalary',
      key: 'netSalary',
      render: (amount: number) => (
        <span className="font-bold text-blue-600 text-lg">
          ${amount.toLocaleString()}
        </span>
      ),
      sorter: (a: PayrollRecord, b: PayrollRecord) => a.netSalary - b.netSalary
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          pending: { color: 'orange', icon: <ClockCircleOutlined />, text: 'Pending' },
          approved: { color: 'blue', icon: <CheckCircleOutlined />, text: 'Approved' },
          paid: { color: 'green', icon: <CheckCircleOutlined />, text: 'Paid' }
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        return (
          <Badge status={config.color as "success" | "processing" | "default" | "error" | "warning"} text={
            <Space>
              {config.icon}
              {config.text}
            </Space>
          } />
        );
      },
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Approved', value: 'approved' },
        { text: 'Paid', value: 'paid' }
      ]
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: PayrollRecord) => (
        <Space>
          {record.status === 'pending' && (
            <Tooltip title="Approve Payroll">
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleApprovePayroll(record.id)}
              >
                Approve
              </Button>
            </Tooltip>
          )}
          {record.status === 'approved' && (
            <Tooltip title="Mark as Paid">
              <Button
                type="primary"
                size="small"
                icon={<DollarOutlined />}
                onClick={() => handleMarkAsPaid(record.id)}
              >
                Pay
              </Button>
            </Tooltip>
          )}
          <Dropdown
            menu={{
              items: [
                {
                  key: 'bonus',
                  icon: <GiftOutlined />,
                  label: 'Add Bonus',
                  onClick: () => {
                    // setSelectedRecord(record);
                    setBonusModalVisible(true);
                  }
                },
                {
                  key: 'raise',
                  icon: <RiseOutlined />,
                  label: 'Apply Raise',
                  onClick: () => {
                    // setSelectedRecord(record);
                    setRaiseModalVisible(true);
                  }
                },
                {
                  key: 'adjustment',
                  icon: <CalculatorOutlined />,
                  label: 'Add Adjustment',
                  onClick: () => {
                    // setSelectedRecord(record);
                    setAdjustmentModalVisible(true);
                  }
                }
              ]
            }}
          >
            <Button size="small" icon={<SettingOutlined />}>
              More
            </Button>
          </Dropdown>
        </Space>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6 p-6 bg-linear-to-br from-blue-50 to-indigo-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-lg">
        <div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            💰 Advanced Payroll Management
          </h1>
          <p className="text-gray-600 mt-2">Comprehensive payroll and payment management system</p>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setGenerateModalVisible(true)}
            className="bg-linear-to-r from-green-500 to-green-600 border-0"
          >
            Generate Payroll
          </Button>
          <Button
            icon={<FileExcelOutlined />}
            size="large"
            onClick={exportToExcel}
            className="bg-linear-to-r from-blue-500 to-blue-600 border-0 text-white"
          >
            Export Excel
          </Button>
          <Button
            icon={<PrinterOutlined />}
            size="large"
            onClick={printReport}
            className="bg-linear-to-r from-purple-500 to-purple-600 border-0 text-white"
          >
            Print Report
          </Button>
        </Space>
      </div>

      {/* Statistics Dashboard */}
      <Row gutter={16}>
        <Col span={4}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title={<Space><TeamOutlined />Total Employees</Space>}
              value={stats.totalEmployees}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title={<Space><DollarOutlined />Total Payroll</Space>}
              value={stats.totalPayroll}
              prefix={<MoneyCollectOutlined />}
              precision={2}
              formatter={(value) => `$${Number(value).toLocaleString()}`}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title={<Space><LineChartOutlined />Average Pay</Space>}
              value={stats.averagePay}
              precision={2}
              formatter={(value) => `$${Number(value).toLocaleString()}`}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title={<Space><ClockCircleOutlined />Pending Approvals</Space>}
              value={stats.pendingApprovals}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title={<Space><TrophyOutlined />Bonuses Given</Space>}
              value={stats.bonusesGiven}
              prefix={<GiftOutlined />}
              formatter={(value) => `$${Number(value).toLocaleString()}`}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
        <Col span={3}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title={<Space><ThunderboltOutlined />Overtime Hours</Space>}
              value={stats.overtimeHours}
              suffix="hrs"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Search */}
      <Card className="shadow-lg">
        <div className="flex flex-wrap gap-4 items-center mb-4">
          <div className="flex items-center gap-2">
            <CalendarOutlined />
            <span className="font-medium">Period:</span>
            <Select
              value={selectedMonth}
              onChange={setSelectedMonth}
              style={{ width: 120 }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <Select.Option key={i + 1} value={i + 1}>
                  {dayjs().month(i).format('MMMM')}
                </Select.Option>
              ))}
            </Select>
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              style={{ width: 100 }}
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <Select.Option key={year} value={year}>
                    {year}
                  </Select.Option>
                );
              })}
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <FilterOutlined />
            <span className="font-medium">Department:</span>
            <Select
              value={selectedDepartment}
              onChange={setSelectedDepartment}
              style={{ width: 150 }}
            >
              <Select.Option value="all">All Departments</Select.Option>
              {Array.from(new Set(payrollRecords.map(r => r.department))).map(dept => (
                <Select.Option key={dept} value={dept}>
                  {dept || 'Unassigned'}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium">Status:</span>
            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ width: 120 }}
            >
              <Select.Option value="all">All Status</Select.Option>
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="approved">Approved</Select.Option>
              <Select.Option value="paid">Paid</Select.Option>
            </Select>
          </div>

          <div className="flex items-center gap-2 flex-1">
            <SearchOutlined />
            <Input
              placeholder="Search employees..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ maxWidth: 300 }}
            />
          </div>

          <Button
            icon={<ReloadOutlined />}
            onClick={fetchPayrollData}
            loading={loadingData}
          >
            Refresh
          </Button>
        </div>

        {/* Progress indicators */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Payroll Processing Progress</span>
            <span>{filteredRecords.filter(r => r.status === 'paid').length}/{filteredRecords.length} completed</span>
          </div>
          <Progress
            percent={filteredRecords.length > 0 ? (filteredRecords.filter(r => r.status === 'paid').length / filteredRecords.length) * 100 : 0}
            status={filteredRecords.every(r => r.status === 'paid') ? 'success' : 'active'}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
        </div>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultActiveKey="payroll" className="bg-white rounded-lg shadow-lg">
        <TabPane
          tab={
            <span>
              <DollarOutlined />
              Payroll Records
            </span>
          }
          key="payroll"
        >
          <Card className="shadow-lg">
            {filteredRecords.length === 0 ? (
              <Empty
                description="No payroll records found for the selected period"
                image={<BarChartOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />}
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setGenerateModalVisible(true)}
                >
                  Generate Payroll
                </Button>
              </Empty>
            ) : (
              <Table
                columns={columns}
                dataSource={filteredRecords}
                loading={loadingData}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} records`
                }}
                summary={() => (
                  <Table.Summary>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}>
                        <strong className="text-lg">TOTAL</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}></Table.Summary.Cell>
                      <Table.Summary.Cell index={2}>
                        <strong className="text-green-600 text-lg">
                          ${filteredRecords.reduce((sum, record) => sum + record.baseSalary, 0).toLocaleString()}
                        </strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3}>
                        <strong className="text-blue-600">
                          ${filteredRecords.reduce((sum, record) => sum + record.overtimePay, 0).toLocaleString()}
                        </strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4}>
                        <strong className="text-purple-600">
                          ${filteredRecords.reduce((sum, record) => sum + record.bonuses, 0).toLocaleString()}
                        </strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={5}>
                        <strong className="text-green-600 text-xl">
                          ${filteredRecords.reduce((sum, record) => sum + record.netSalary, 0).toLocaleString()}
                        </strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={6}></Table.Summary.Cell>
                      <Table.Summary.Cell index={7}></Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            )}
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <MoneyCollectOutlined />
              Payment History
            </span>
          }
          key="payments"
        >
          <Card className="shadow-lg">
            <Table
              columns={[
                {
                  title: 'Employee',
                  dataIndex: 'userId',
                  key: 'userId',
                  render: (userId: number) => `Employee ${userId}`
                },
                {
                  title: 'Amount',
                  dataIndex: 'amount',
                  key: 'amount',
                  render: (amount: number) => `$${amount.toLocaleString()}`
                },
                {
                  title: 'Type',
                  dataIndex: 'type',
                  key: 'type',
                  render: (type: string) => (
                    <Tag color={type === 'salary' ? 'green' : 'blue'}>{type}</Tag>
                  )
                },
                {
                  title: 'Date',
                  dataIndex: 'date',
                  key: 'date',
                  render: (date: string) => dayjs(date).format('MMM DD, YYYY')
                },
                {
                  title: 'Description',
                  dataIndex: 'description',
                  key: 'description'
                }
              ]}
              dataSource={paymentRecords}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true
              }}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <BarChartOutlined />
              Analytics
            </span>
          }
          key="analytics"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Card title="Payroll Distribution" className="shadow-lg">
                <div className="text-center py-8">
                  <PieChartOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                  <p className="mt-4 text-gray-500">Chart visualization coming soon</p>
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Monthly Trends" className="shadow-lg">
                <div className="text-center py-8">
                  <BarChartOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                  <p className="mt-4 text-gray-500">Trend analysis coming soon</p>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* Generate Payroll Modal */}
      <Modal
        title={
          <Space>
            <CalculatorOutlined />
            Generate Monthly Payroll
          </Space>
        }
        open={generateModalVisible}
        onCancel={() => setGenerateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={generateForm}
          layout="vertical"
          onFinish={handleGeneratePayroll}
        >
          <Form.Item
            label="Month"
            name="month"
            rules={[{ required: true, message: 'Please select month' }]}
          >
            <Select placeholder="Select month">
              {Array.from({ length: 12 }, (_, i) => (
                <Select.Option key={i + 1} value={i + 1}>
                  {dayjs().month(i).format('MMMM')}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Year"
            name="year"
            rules={[{ required: true, message: 'Please select year' }]}
          >
            <Select placeholder="Select year">
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <Select.Option key={year} value={year}>
                    {year}
                  </Select.Option>
                );
              })}
            </Select>
          </Form.Item>

          <Form.Item
            label="Department (Optional)"
            name="departmentId"
          >
            <Select placeholder="Select department (leave empty for all)">
              <Select.Option value={null}>All Departments</Select.Option>
              {/* Add department options here */}
            </Select>
          </Form.Item>

          <Form.Item className="text-right">
            <Space>
              <Button onClick={() => setGenerateModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" icon={<CalculatorOutlined />}>
                Generate Payroll
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Bonus Modal */}
      <Modal
        title={
          <Space>
            <GiftOutlined />
            Add Bonus
          </Space>
        }
        open={bonusModalVisible}
        onCancel={() => setBonusModalVisible(false)}
        footer={null}
      >
        <Form
          form={bonusForm}
          layout="vertical"
          onFinish={(values) => {
            console.log('Add bonus:', values);
            setBonusModalVisible(false);
            bonusForm.resetFields();
            message.success('Bonus added successfully!');
          }}
        >
          <Form.Item
            label="Bonus Amount"
            name="amount"
            rules={[{ required: true, message: 'Please enter bonus amount' }]}
          >
            <InputNumber
              prefix="$"
              min={0}
              style={{ width: '100%' }}
              placeholder="Enter bonus amount"
            />
          </Form.Item>

          <Form.Item
            label="Reason"
            name="reason"
            rules={[{ required: true, message: 'Please enter reason' }]}
          >
            <Input.TextArea
              placeholder="Enter reason for bonus"
              rows={3}
            />
          </Form.Item>

          <Form.Item className="text-right">
            <Space>
              <Button onClick={() => setBonusModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" icon={<GiftOutlined />}>
                Add Bonus
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Raise Modal */}
      <Modal
        title={
          <Space>
            <RiseOutlined />
            Apply Salary Raise
          </Space>
        }
        open={raiseModalVisible}
        onCancel={() => setRaiseModalVisible(false)}
        footer={null}
      >
        <Form
          form={raiseForm}
          layout="vertical"
          onFinish={(values) => {
            console.log('Apply raise:', values);
            setRaiseModalVisible(false);
            raiseForm.resetFields();
            message.success('Salary raise applied successfully!');
          }}
        >
          <Form.Item
            label="Raise Type"
            name="type"
            rules={[{ required: true, message: 'Please select raise type' }]}
          >
            <Select placeholder="Select raise type">
              <Select.Option value="percentage">Percentage Increase</Select.Option>
              <Select.Option value="fixed">Fixed Amount</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Raise Amount"
            name="amount"
            rules={[{ required: true, message: 'Please enter raise amount' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="Enter raise amount"
            />
          </Form.Item>

          <Form.Item
            label="Effective Date"
            name="effectiveDate"
            rules={[{ required: true, message: 'Please select effective date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Reason"
            name="reason"
            rules={[{ required: true, message: 'Please enter reason' }]}
          >
            <Input.TextArea
              placeholder="Enter reason for raise"
              rows={3}
            />
          </Form.Item>

          <Form.Item className="text-right">
            <Space>
              <Button onClick={() => setRaiseModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" icon={<RiseOutlined />}>
                Apply Raise
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Adjustment Modal */}
      <Modal
        title={
          <Space>
            <CalculatorOutlined />
            Add Adjustment
          </Space>
        }
        open={adjustmentModalVisible}
        onCancel={() => setAdjustmentModalVisible(false)}
        footer={null}
      >
        <Form
          form={adjustmentForm}
          layout="vertical"
          onFinish={(values) => {
            console.log('Add adjustment:', values);
            setAdjustmentModalVisible(false);
            adjustmentForm.resetFields();
            message.success('Adjustment added successfully!');
          }}
        >
          <Form.Item
            label="Adjustment Type"
            name="type"
            rules={[{ required: true, message: 'Please select adjustment type' }]}
          >
            <Select placeholder="Select adjustment type">
              <Select.Option value="overtime">Overtime Pay</Select.Option>
              <Select.Option value="deduction">Deduction</Select.Option>
              <Select.Option value="allowance">Allowance</Select.Option>
              <Select.Option value="correction">Correction</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Amount"
            name="amount"
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter adjustment amount"
            />
          </Form.Item>

          <Form.Item
            label="Hours (for overtime)"
            name="hours"
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="Enter hours (if applicable)"
            />
          </Form.Item>

          <Form.Item
            label="Reason"
            name="reason"
            rules={[{ required: true, message: 'Please enter reason' }]}
          >
            <Input.TextArea
              placeholder="Enter reason for adjustment"
              rows={3}
            />
          </Form.Item>

          <Form.Item className="text-right">
            <Space>
              <Button onClick={() => setAdjustmentModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" icon={<CalculatorOutlined />}>
                Add Adjustment
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}