'use client';

import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/api';

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  SearchOutlined,
  FilterOutlined,
  PrinterOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  EyeOutlined,
  LoginOutlined,
  LogoutOutlined,
  WarningOutlined
} from '@ant-design/icons';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useState } from 'react';

import { 
  Card, Button, Table, Tag, DatePicker, Select, Input, Space, message, 
  Modal, Form, Row, Col, Statistic, Tooltip, TimePicker, Alert 
} from 'antd';

import dayjs, { Dayjs } from 'dayjs';

import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

interface Employee {
  id: number;
  fullName: string;
  employeeCode: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  departmentId?: number;
  role: string;
  currentShift: {
    shiftName: string;
    shiftCode: string;
    startTime: string;
    endTime: string;
  } | null;
  attendance: {
    id: number;
    date: string;
    checkIn: string | null;
    checkOut: string | null;
    workingHours: number;
    status: string;
    isLate: boolean;
    lateMinutes: number;
    isEarlyDeparture: boolean;
    earlyDepartureMinutes: number;
    overtimeMinutes: number;
    breakDuration: number;
    location?: string;
    notes?: string;
  } | null;
}

export default function AdminAttendanceManagementPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Separate form instances for each modal to prevent conflicts
  const [checkInForm] = Form.useForm();
  const [checkOutForm] = Form.useForm();
  const [absentForm] = Form.useForm();
  
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  
  // Modal states
  const [checkInModal, setCheckInModal] = useState(false);
  const [checkOutModal, setCheckOutModal] = useState(false);
  const [absentModal, setAbsentModal] = useState(false);
  const [detailsModal, setDetailsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Fetch departments
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiClient.getDepartments(),
  });

  // Fetch employees with attendance
  const { data: employeesData, isLoading, refetch } = useQuery({
    queryKey: ['employees-attendance', selectedDate, selectedDepartment, searchQuery],
    queryFn: () => apiClient.getAllEmployeesWithAttendance({
      date: selectedDate,
      departmentId: selectedDepartment,
      search: searchQuery
    }),
  });

  const employees: Employee[] = employeesData?.employees || [];

  // Calculate statistics with latency information
  const stats = {
    total: employees.length,
    present: employees.filter(e => e.attendance && (e.attendance.status === 'present' || e.attendance.status === 'late')).length,
    absent: employees.filter(e => e.attendance && e.attendance.status === 'absent').length,
    late: employees.filter(e => e.attendance && e.attendance.isLate).length,
    earlyDepartures: employees.filter(e => e.attendance && e.attendance.isEarlyDeparture).length,
    overtime: employees.filter(e => e.attendance && e.attendance.overtimeMinutes && e.attendance.overtimeMinutes > 0).length,
    notMarked: employees.filter(e => !e.attendance).length
  };

  // Mutations
  const checkInMutation = useMutation({
    mutationFn: (data: any) => apiClient.markEmployeeCheckIn(data),
    onSuccess: () => {
      message.success('Employee checked in successfully!');
      setCheckInModal(false);
      checkInForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['employees-attendance'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to check in');
    }
  });

  const checkOutMutation = useMutation({
    mutationFn: (data: any) => apiClient.markEmployeeCheckOut(data),
    onSuccess: () => {
      message.success('Employee checked out successfully!');
      setCheckOutModal(false);
      checkOutForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['employees-attendance'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to check out');
    }
  });

  const markAbsentMutation = useMutation({
    mutationFn: (data: any) => apiClient.markEmployeeAbsent(data),
    onSuccess: () => {
      message.success('Employee marked as absent!');
      setAbsentModal(false);
      absentForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['employees-attendance'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to mark absent');
    }
  });

  const bulkMarkMutation = useMutation({
    mutationFn: (data: any) => apiClient.bulkMarkAttendance(data),
    onSuccess: () => {
      message.success('Bulk action completed successfully!');
      setSelectedEmployees([]);
      setBulkAction('');
      queryClient.invalidateQueries({ queryKey: ['employees-attendance'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to perform bulk action');
    }
  });

  // Handlers
  const handleCheckIn = (employee: Employee) => {
    setSelectedEmployee(employee);
    checkInForm.setFieldsValue({
      checkInTime: dayjs(),
      location: 'Office',
      notes: ''
    });
    setCheckInModal(true);
  };

  const handleCheckOut = (employee: Employee) => {
    setSelectedEmployee(employee);
    checkOutForm.setFieldsValue({
      checkOutTime: dayjs(),
      location: 'Office',
      notes: ''
    });
    setCheckOutModal(true);
  };

  const handleMarkAbsent = (employee: Employee) => {
    setSelectedEmployee(employee);
    absentForm.resetFields(); // Clear any previous values
    setAbsentModal(true);
  };

  const handleViewDetails = async (employee: Employee) => {
    if (!employee.attendance) {
      message.warning('No attendance record for this date');
      return;
    }
    setSelectedEmployee(employee);
    setDetailsModal(true);
  };

  const handleViewLatencyDetails = (employee: Employee) => {
    if (!employee.attendance) {
      message.warning('No attendance record for this date');
      return;
    }

    const attendance = employee.attendance;
    const latencyInfo = [];

    if (attendance.isLate) {
      latencyInfo.push(`🔴 Late Arrival: ${attendance.lateMinutes} minutes`);
    }
    if (attendance.isEarlyDeparture) {
      latencyInfo.push(`🟠 Early Departure: ${attendance.earlyDepartureMinutes} minutes`);
    }
    if (attendance.overtimeMinutes && attendance.overtimeMinutes > 0) {
      latencyInfo.push(`🔵 Overtime: ${attendance.overtimeMinutes} minutes`);
    }

    if (latencyInfo.length === 0) {
      latencyInfo.push('✅ No latency issues - Employee was on time');
    }

    Modal.info({
      title: `⚠️ Latency Details: ${employee.fullName}`,
      width: 600,
      content: (
        <div className="space-y-4 mt-4">
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">Date: {dayjs(selectedDate).format('MMMM DD, YYYY')}</p>
            <p className="text-sm text-gray-600">Employee Code: {employee.employeeCode}</p>
            <p className="text-sm text-gray-600">Department: {employee.department || 'N/A'}</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-500">
            <h3 className="font-semibold mb-2">Attendance Times:</h3>
            <p className="text-sm">Check In: {attendance.checkIn ? dayjs(attendance.checkIn).format('hh:mm A') : 'Not checked in'}</p>
            <p className="text-sm">Check Out: {attendance.checkOut ? dayjs(attendance.checkOut).format('hh:mm A') : 'Not checked out'}</p>
            {attendance.workingHours && (
              <p className="text-sm">Working Hours: {Math.floor(attendance.workingHours / 60)}h {attendance.workingHours % 60}m</p>
            )}
          </div>

          <div className="bg-yellow-50 p-4 rounded border-l-4 border-yellow-500">
            <h3 className="font-semibold mb-2">Latency Information:</h3>
            {latencyInfo.map((info, idx) => (
              <p key={idx} className="text-sm mb-1">{info}</p>
            ))}
          </div>
        </div>
      ),
    });
  };

  const handlePrint = () => {
    if (employees.length === 0) {
      message.warning('No employee data to print');
      return;
    }

    const printContent = `
      <html>
        <head>
          <title>Attendance Report - ${dayjs(selectedDate).format('MMMM DD, YYYY')}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; text-align: center; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat-box { padding: 15px; border: 2px solid #4CAF50; border-radius: 8px; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #4CAF50; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Attendance Report</h1>
            <p><strong>Date:</strong> ${dayjs(selectedDate).format('MMMM DD, YYYY')}</p>
            <p><strong>Generated:</strong> ${dayjs().format('MMMM DD, YYYY hh:mm A')}</p>
          </div>
          
          <div class="stats">
            <div class="stat-box"><h3>${stats.total}</h3><p>Total</p></div>
            <div class="stat-box"><h3>${stats.present}</h3><p>Present</p></div>
            <div class="stat-box"><h3>${stats.absent}</h3><p>Absent</p></div>
            <div class="stat-box"><h3>${stats.late}</h3><p>Late</p></div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Employee Name</th>
                <th>Code</th>
                <th>Department</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
                <th>Working Hours</th>
                <th>Late/Early</th>
              </tr>
            </thead>
            <tbody>
              ${employees.map((emp, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${emp.fullName || '-'}</td>
                  <td>${emp.employeeCode || '-'}</td>
                  <td>${emp.department || '-'}</td>
                  <td>${emp.attendance?.checkIn ? dayjs(emp.attendance.checkIn).format('hh:mm A') : '-'}</td>
                  <td>${emp.attendance?.checkOut ? dayjs(emp.attendance.checkOut).format('hh:mm A') : '-'}</td>
                  <td>${emp.attendance?.status || 'Not Marked'}</td>
                  <td>${emp.attendance?.workingHours ? Math.floor(emp.attendance.workingHours / 60) + 'h ' + (emp.attendance.workingHours % 60) + 'm' : '-'}</td>
                  <td>
                    ${emp.attendance?.isLate ? `Late: ${emp.attendance.lateMinutes}m` : ''}
                    ${emp.attendance?.isEarlyDeparture ? `Early: ${emp.attendance.earlyDepartureMinutes}m` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>© ${dayjs().year()} HR Management System - Confidential</p>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 250);
    } else {
      message.error('Please allow popups to print the report');
    }
  };

  const handleExportCSV = async () => {
    const hide = message.loading('Preparing CSV export...', 0);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        hide();
        message.error('Not authenticated. Please login again.');
        return;
      }

      const params = new URLSearchParams({
        startDate: selectedDate,
        endDate: selectedDate,
        format: 'daily',
        ...(selectedDepartment && { departmentId: selectedDepartment })
      });
      
      const downloadUrl = `http://localhost:3001/api/admin/attendance/export/csv?${params.toString()}`;
      
      console.log('Downloading CSV from:', downloadUrl);
      
      // Download file using fetch with auth header
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('CSV export error:', errorText);
        throw new Error(`Failed to export CSV: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${selectedDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      hide();
      message.success('CSV exported successfully!');
    } catch (error: any) {
      hide();
      console.error('CSV export error:', error);
      message.error(error.message || 'Failed to export CSV');
    }
  };

  const handleGenerateReport = async (type: 'daily' | 'monthly' | 'yearly') => {
    const hide = message.loading(`Generating ${type} report...`, 0);
    
    try {
      const date = dayjs(selectedDate);
      const params: any = { type };
      
      if (type === 'daily') {
        params.date = selectedDate;
      } else if (type === 'monthly') {
        params.month = date.month() + 1;
        params.year = date.year();
      } else if (type === 'yearly') {
        params.year = date.year();
      }
      
      if (selectedDepartment) params.departmentId = selectedDepartment;

      console.log('Generating report with params:', params);

      const response = await apiClient.getAttendanceReport(params);
      
      console.log('Report response:', response);
      
      hide();
      
      if (response && response.data) {
        const stats = response.data.statistics || response.data;
        
        Modal.success({
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report Generated`,
          width: 600,
          content: (
            <div className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-gray-600 text-sm">Total Records</p>
                  <p className="text-2xl font-bold">{stats.totalRecords || stats.total || 0}</p>
                </div>
                <div className="p-3 bg-green-50 rounded">
                  <p className="text-gray-600 text-sm">Present</p>
                  <p className="text-2xl font-bold text-green-600">{stats.present || 0}</p>
                </div>
                <div className="p-3 bg-red-50 rounded">
                  <p className="text-gray-600 text-sm">Absent</p>
                  <p className="text-2xl font-bold text-red-600">{stats.absent || 0}</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded">
                  <p className="text-gray-600 text-sm">Late Arrivals</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.late || 0}</p>
                </div>
              </div>
              <div className="pt-3 border-t">
                <p><strong>Total Working Hours:</strong> {stats.totalWorkingHours || 0}h</p>
                <p><strong>Total Overtime:</strong> {stats.totalOvertimeHours || 0}h</p>
                <p><strong>Early Departures:</strong> {stats.earlyDepartures || 0}</p>
              </div>
            </div>
          ),
          okText: 'Close'
        });
      } else {
        message.warning('No data available for this period');
      }
    } catch (error: any) {
      hide();
      console.error('Report generation error:', error);
      message.error(error.response?.data?.message || error.message || 'Failed to generate report');
    }
  };

  const handleBulkAction = () => {
    if (selectedEmployees.length === 0) {
      message.warning('Please select employees first');
      return;
    }

    if (!bulkAction) {
      message.warning('Please select an action');
      return;
    }

    const actionText = {
      'checkin': 'check in',
      'checkout': 'check out',
      'present': 'mark as present',
      'absent': 'mark as absent'
    }[bulkAction] || bulkAction;

    Modal.confirm({
      title: 'Confirm Bulk Action',
      content: `Are you sure you want to ${actionText} for ${selectedEmployees.length} employees?`,
      onOk: () => {
        bulkMarkMutation.mutate({
          employees: selectedEmployees,
          date: selectedDate,
          status: bulkAction,
          notes: `Bulk ${actionText} by admin`
        });
      }
    });
  };

  const getStatusTag = (employee: Employee) => {
    if (!employee.attendance) {
      return <Tag icon={<ClockCircleOutlined />} color="default">Not Marked</Tag>;
    }
    
    const { status, isLate, lateMinutes } = employee.attendance;
    
    if (isLate) {
      return <Tag icon={<WarningOutlined />} color="warning">Late ({lateMinutes}m)</Tag>;
    }
    
    if (status === 'present') {
      return <Tag icon={<CheckCircleOutlined />} color="success">Present</Tag>;
    }
    
    if (status === 'absent') {
      return <Tag icon={<CloseCircleOutlined />} color="error">Absent</Tag>;
    }
    
    return <Tag color="default">{status}</Tag>;
  };

  const columns: ColumnsType<Employee> = [
    {
      title: <input 
        type="checkbox"
        title="Select All"
        aria-label="Select All Employees"
        checked={selectedEmployees.length === employees.length && employees.length > 0}
        onChange={(e) => {
          if (e.target.checked) {
            setSelectedEmployees(employees.map(emp => emp.id));
          } else {
            setSelectedEmployees([]);
          }
        }}
      />,
      key: 'select',
      width: 50,
      render: (_, employee) => (
        <input
          type="checkbox"
          title={`Select ${employee.fullName}`}
          aria-label={`Select ${employee.fullName}`}
          checked={selectedEmployees.includes(employee.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedEmployees([...selectedEmployees, employee.id]);
            } else {
              setSelectedEmployees(selectedEmployees.filter(id => id !== employee.id));
            }
          }}
        />
      )
    },
    {
      title: 'Employee',
      key: 'employee',
      render: (_, employee) => (
        <div>
          <div className="font-medium">{employee.fullName}</div>
          <div className="text-gray-500 text-sm">{employee.employeeCode}</div>
        </div>
      )
    },
    {
      title: 'Department',
      key: 'department',
      render: (_, employee) => (
        <Tag color="blue">{employee.department || 'No Department'}</Tag>
      )
    },
    {
      title: 'Check In',
      key: 'checkIn',
      render: (_, employee) => employee.attendance?.checkIn ? 
        dayjs(employee.attendance.checkIn).format('hh:mm A') : '-'
    },
    {
      title: 'Check Out',
      key: 'checkOut',
      render: (_, employee) => employee.attendance?.checkOut ? 
        dayjs(employee.attendance.checkOut).format('hh:mm A') : '-'
    },
    {
      title: 'Working Hours',
      key: 'workingHours',
      render: (_, employee) => {
        if (!employee.attendance?.workingHours) return '-';
        const hours = Math.floor(employee.attendance.workingHours / 60);
        const mins = employee.attendance.workingHours % 60;
        return `${hours}h ${mins}m`;
      }
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, employee) => getStatusTag(employee)
    },
    {
      title: '⚠️ LATENCY INFO',
      key: 'latency',
      width: 250,
      render: (_, employee) => {
        if (!employee.attendance) {
          return <span className="text-gray-400 text-sm italic">No attendance today</span>;
        }

        const hasLatency = employee.attendance.isLate || 
                          employee.attendance.isEarlyDeparture || 
                          (employee.attendance.overtimeMinutes && employee.attendance.overtimeMinutes > 0);

        if (!hasLatency) {
          return <Tag color="success" className="text-sm">✅ On Time</Tag>;
        }

        return (
          <div className="flex flex-col gap-2">
            {/* Late Arrival - RED */}
            {employee.attendance.isLate && (
              <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded border-l-4 border-red-500">
                <WarningOutlined className="text-red-600 text-lg" />
                <span className="text-red-700 font-semibold">
                  LATE: {employee.attendance.lateMinutes} minutes
                </span>
              </div>
            )}
            
            {/* Early Departure - ORANGE */}
            {employee.attendance.isEarlyDeparture && (
              <div className="flex items-center gap-2 bg-orange-50 px-3 py-2 rounded border-l-4 border-orange-500">
                <ClockCircleOutlined className="text-orange-600 text-lg" />
                <span className="text-orange-700 font-semibold">
                  LEFT EARLY: {employee.attendance.earlyDepartureMinutes} minutes
                </span>
              </div>
            )}
            
            {/* Overtime - BLUE */}
            {employee.attendance.overtimeMinutes && employee.attendance.overtimeMinutes > 0 && (
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded border-l-4 border-blue-500">
                <ClockCircleOutlined className="text-blue-600 text-lg" />
                <span className="text-blue-700 font-semibold">
                  OVERTIME: {employee.attendance.overtimeMinutes} minutes
                </span>
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, employee) => (
        <Space direction="vertical" size="small" className="w-full">
          {/* Action Buttons Row */}
          <Space wrap>
            {!employee.attendance?.checkIn && (
              <Button 
                type="primary" 
                size="small" 
                icon={<LoginOutlined />}
                onClick={() => handleCheckIn(employee)}
              >
                Check In
              </Button>
            )}
            {employee.attendance?.checkIn && !employee.attendance?.checkOut && (
              <Button 
                danger
                size="small" 
                icon={<LogoutOutlined />}
                onClick={() => handleCheckOut(employee)}
              >
                Check Out
              </Button>
            )}
            {!employee.attendance && (
              <Button 
                danger
                size="small"
                onClick={() => handleMarkAbsent(employee)}
              >
                Mark Absent
              </Button>
            )}
            
            {/* Latency Details Button - Always show if attendance exists */}
            {employee.attendance && (
              <Button 
                type="default"
                size="small" 
                icon={<ClockCircleOutlined />}
                onClick={() => handleViewLatencyDetails(employee)}
                style={{ 
                  borderColor: employee.attendance.isLate || employee.attendance.isEarlyDeparture ? '#faad14' : '#d9d9d9',
                  color: employee.attendance.isLate || employee.attendance.isEarlyDeparture ? '#faad14' : 'inherit'
                }}
              >
                Latency
              </Button>
            )}
          </Space>

          {/* Latency Warnings in Actions */}
          {employee.attendance?.isLate && (
            <Tag icon={<WarningOutlined />} color="error" className="w-full text-center">
              ⚠️ LATE: {employee.attendance.lateMinutes}min
            </Tag>
          )}
          {employee.attendance?.isEarlyDeparture && (
            <Tag icon={<ClockCircleOutlined />} color="orange" className="w-full text-center">
              🕐 LEFT EARLY: {employee.attendance.earlyDepartureMinutes}min
            </Tag>
          )}
          {employee.attendance?.overtimeMinutes && employee.attendance.overtimeMinutes > 0 && (
            <Tag icon={<ClockCircleOutlined />} color="blue" className="w-full text-center">
              ⏱️ OT: {employee.attendance.overtimeMinutes}min
            </Tag>
          )}
        </Space>
      )
    }
  ];

  return (
    <DashboardLayout role={user?.role || 'ROLE_ADMIN'}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              📊 Attendance Management
            </h1>
            <p className="text-gray-600 mt-1">Manage employee attendance and track work hours</p>
          </div>
          <Space>
            <Button icon={<PrinterOutlined />} onClick={handlePrint}>
              Print
            </Button>
            <Button icon={<FileExcelOutlined />} onClick={handleExportCSV}>
              Export CSV
            </Button>
            <Select 
              placeholder="Generate Report"
              style={{ width: 180 }}
              onChange={handleGenerateReport}
            >
              <Option value="daily">Daily Report</Option>
              <Option value="monthly">Monthly Report</Option>
              <Option value="yearly">Yearly Report</Option>
            </Select>
          </Space>
        </div>

        {/* Statistics */}
        <Row gutter={16} className="mb-6">
          <Col span={5}>
            <Card>
              <Statistic
                title="Total Employees"
                value={stats.total}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col span={5}>
            <Card>
              <Statistic
                title="Present"
                value={stats.present}
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircleOutlined />}
                suffix={`/ ${stats.total}`}
              />
            </Card>
          </Col>
          <Col span={5}>
            <Card>
              <Statistic
                title="Absent"
                value={stats.absent}
                valueStyle={{ color: '#cf1322' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={5}>
            <Card>
              <Statistic
                title="🕐 Late Arrivals"
                value={stats.late}
                valueStyle={{ color: '#faad14' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="⏰ Early Departures"
                value={stats.earlyDepartures}
                valueStyle={{ color: '#ff7a45' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="mb-6">
          <Space size="middle" wrap>
            <DatePicker
              value={dayjs(selectedDate)}
              onChange={(date) => setSelectedDate(date?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'))}
              format="YYYY-MM-DD"
            />
            <Select
              placeholder="All Departments"
              style={{ width: 200 }}
              allowClear
              value={selectedDepartment}
              onChange={setSelectedDepartment}
            >
              {departmentsData?.map((dept: any) => (
                <Option key={dept.id} value={dept.id.toString()}>
                  {dept.departmentName}
                </Option>
              ))}
            </Select>
            <Input
              placeholder="Search employees..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 250 }}
            />
            {selectedEmployees.length > 0 && (
              <>
                <Select
                  placeholder="Select Bulk Action"
                  style={{ width: 200 }}
                  value={bulkAction}
                  onChange={setBulkAction}
                >
                  <Option value="checkin">✅ Check In All</Option>
                  <Option value="checkout">🚪 Check Out All</Option>
                  <Option value="present">👍 Mark Present</Option>
                  <Option value="absent">❌ Mark Absent</Option>
                </Select>
                <Button type="primary" onClick={handleBulkAction} size="large">
                  Apply to {selectedEmployees.length} selected
                </Button>
              </>
            )}
          </Space>
        </Card>

        {/* Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={employees}
            rowKey="id"
            loading={isLoading}
            pagination={{
              pageSize: 15,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} employees`
            }}
          />
        </Card>

        {/* Check In Modal */}
        <Modal
          title={`Check In: ${selectedEmployee?.fullName}`}
          open={checkInModal}
          onCancel={() => setCheckInModal(false)}
          onOk={() => checkInForm.submit()}
          confirmLoading={checkInMutation.isPending}
          width={600}
        >
          <Form
            form={checkInForm}
            layout="vertical"
            onFinish={(values) => {
              // Combine selected date with time
              const checkInDateTime = dayjs(selectedDate)
                .hour(values.checkInTime.hour())
                .minute(values.checkInTime.minute())
                .second(0);
              
              checkInMutation.mutate({
                employeeId: selectedEmployee!.id,
                checkInTime: checkInDateTime.toISOString(),
                location: values.location,
                notes: values.notes
              });
            }}
          >
            <div className="mb-4 p-3 bg-blue-50 rounded">
              <p className="text-sm text-gray-700">
                <strong>Date:</strong> {dayjs(selectedDate).format('MMMM DD, YYYY')}
              </p>
              {selectedEmployee?.currentShift && (
                <p className="text-sm text-gray-700">
                  <strong>Shift Start:</strong> {selectedEmployee.currentShift.startTime}
                </p>
              )}
            </div>

            <Form.Item 
              name="checkInTime" 
              label={
                <div className="flex items-center justify-between w-full">
                  <span>Check-in Time (Time Only)</span>
                  <Button 
                    size="small" 
                    type="link"
                    onClick={() => {
                      if (selectedEmployee?.currentShift?.startTime) {
                        // Parse shift start time (e.g., "09:00:00")
                        const [hours, minutes] = selectedEmployee.currentShift.startTime.split(':');
                        const defaultTime = dayjs().hour(parseInt(hours)).minute(parseInt(minutes));
                        checkInForm.setFieldValue('checkInTime', defaultTime);
                      } else {
                        // Default to 9 AM if no shift
                        checkInForm.setFieldValue('checkInTime', dayjs().hour(9).minute(0));
                      }
                    }}
                  >
                    🕐 Set Default Time
                  </Button>
                </div>
              } 
              rules={[{ required: true, message: 'Please select check-in time' }]}
            >
              <TimePicker 
                format="HH:mm" 
                style={{ width: '100%' }} 
                size="large"
                placeholder="Select time (e.g., 09:00)"
                showNow={false}
              />
            </Form.Item>

            <Alert
              message="💡 Tip"
              description="Click 'Set Default Time' to use the employee's shift start time, or manually select a time if they arrived late/early."
              type="info"
              showIcon
              className="mb-4"
            />

            <Form.Item name="location" label="Location" rules={[{ required: true }]}>
              <Input placeholder="e.g., Main Office" defaultValue="Office" />
            </Form.Item>
            <Form.Item name="notes" label="Notes">
              <Input.TextArea rows={2} placeholder="Optional notes..." />
            </Form.Item>
          </Form>
        </Modal>

        {/* Check Out Modal */}
        <Modal
          title={`Check Out: ${selectedEmployee?.fullName}`}
          open={checkOutModal}
          onCancel={() => setCheckOutModal(false)}
          onOk={() => checkOutForm.submit()}
          confirmLoading={checkOutMutation.isPending}
          width={600}
        >
          <Form
            form={checkOutForm}
            layout="vertical"
            onFinish={(values) => {
              // Combine selected date with time
              const checkOutDateTime = dayjs(selectedDate)
                .hour(values.checkOutTime.hour())
                .minute(values.checkOutTime.minute())
                .second(0);
              
              checkOutMutation.mutate({
                employeeId: selectedEmployee!.id,
                checkOutTime: checkOutDateTime.toISOString(),
                location: values.location,
                notes: values.notes
              });
            }}
          >
            <div className="mb-4 p-3 bg-blue-50 rounded">
              <p className="text-sm text-gray-700">
                <strong>Date:</strong> {dayjs(selectedDate).format('MMMM DD, YYYY')}
              </p>
              {selectedEmployee?.currentShift && (
                <p className="text-sm text-gray-700">
                  <strong>Shift End:</strong> {selectedEmployee.currentShift.endTime}
                </p>
              )}
              {selectedEmployee?.attendance?.checkIn && (
                <p className="text-sm text-gray-700">
                  <strong>Checked In At:</strong> {dayjs(selectedEmployee.attendance.checkIn).format('hh:mm A')}
                </p>
              )}
            </div>

            <Form.Item 
              name="checkOutTime" 
              label={
                <div className="flex items-center justify-between w-full">
                  <span>Check-out Time (Time Only)</span>
                  <Button 
                    size="small" 
                    type="link"
                    onClick={() => {
                      if (selectedEmployee?.currentShift?.endTime) {
                        // Parse shift end time (e.g., "17:00:00")
                        const [hours, minutes] = selectedEmployee.currentShift.endTime.split(':');
                        const defaultTime = dayjs().hour(parseInt(hours)).minute(parseInt(minutes));
                        checkOutForm.setFieldValue('checkOutTime', defaultTime);
                      } else {
                        // Default to 5 PM if no shift
                        checkOutForm.setFieldValue('checkOutTime', dayjs().hour(17).minute(0));
                      }
                    }}
                  >
                    🕐 Set Default Time
                  </Button>
                </div>
              } 
              rules={[{ required: true, message: 'Please select check-out time' }]}
            >
              <TimePicker 
                format="HH:mm" 
                style={{ width: '100%' }} 
                size="large"
                placeholder="Select time (e.g., 17:00)"
                showNow={false}
              />
            </Form.Item>

            <Alert
              message="💡 Tip"
              description="Click 'Set Default Time' to use shift end time. If checking out late (e.g., 6 PM when shift ends at 5 PM), overtime will be automatically calculated."
              type="info"
              showIcon
              className="mb-4"
            />

            <Form.Item name="location" label="Location" rules={[{ required: true }]}>
              <Input placeholder="e.g., Main Office" defaultValue="Office" />
            </Form.Item>
            <Form.Item name="notes" label="Notes">
              <Input.TextArea rows={2} placeholder="Optional notes..." />
            </Form.Item>
          </Form>
        </Modal>

        {/* Mark Absent Modal */}
        <Modal
          title={`Mark Absent: ${selectedEmployee?.fullName}`}
          open={absentModal}
          onCancel={() => setAbsentModal(false)}
          onOk={() => absentForm.submit()}
          confirmLoading={markAbsentMutation.isPending}
        >
          <Form
            form={absentForm}
            layout="vertical"
            onFinish={(values) => {
              markAbsentMutation.mutate({
                employeeId: selectedEmployee!.id,
                date: selectedDate,
                reason: values.reason || 'Marked absent by admin'
              });
            }}
          >
            <Form.Item name="reason" label="Reason (Optional)">
              <Input.TextArea rows={4} placeholder="Enter reason for absence (optional)..." />
            </Form.Item>
          </Form>
        </Modal>

        {/* Details Modal */}
        <Modal
          title={`Attendance Details: ${selectedEmployee?.fullName}`}
          open={detailsModal}
          onCancel={() => setDetailsModal(false)}
          footer={[
            <Button key="close" onClick={() => setDetailsModal(false)}>
              Close
            </Button>
          ]}
        >
          {selectedEmployee?.attendance && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Check-in</p>
                  <p className="font-semibold">
                    {selectedEmployee.attendance.checkIn ? 
                      dayjs(selectedEmployee.attendance.checkIn).format('hh:mm A') : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Check-out</p>
                  <p className="font-semibold">
                    {selectedEmployee.attendance.checkOut ? 
                      dayjs(selectedEmployee.attendance.checkOut).format('hh:mm A') : '-'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-gray-600">Working Hours</p>
                <p className="font-semibold">
                  {Math.floor(selectedEmployee.attendance.workingHours / 60)}h {selectedEmployee.attendance.workingHours % 60}m
                </p>
              </div>
              {selectedEmployee.attendance.isLate && (
                <div className="p-3 bg-yellow-50 rounded">
                  <p className="text-yellow-800">
                    ⚠️ Late by {selectedEmployee.attendance.lateMinutes} minutes
                  </p>
                </div>
              )}
              {selectedEmployee.attendance.isEarlyDeparture && (
                <div className="p-3 bg-orange-50 rounded">
                  <p className="text-orange-800">
                    ⚠️ Early departure by {selectedEmployee.attendance.earlyDepartureMinutes} minutes
                  </p>
                </div>
              )}
              {selectedEmployee.attendance.overtimeMinutes > 0 && (
                <div className="p-3 bg-blue-50 rounded">
                  <p className="text-blue-800">
                    ⏱️ Overtime: {selectedEmployee.attendance.overtimeMinutes} minutes
                  </p>
                </div>
              )}
              {selectedEmployee.attendance.location && (
                <div>
                  <p className="text-gray-600">Location</p>
                  <p className="font-semibold">📍 {selectedEmployee.attendance.location}</p>
                </div>
              )}
              {selectedEmployee.attendance.notes && (
                <div>
                  <p className="text-gray-600">Notes</p>
                  <p className="font-semibold">{selectedEmployee.attendance.notes}</p>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
