'use client';

import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api';
import { useTranslations } from 'next-intl';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  SearchOutlined,
  WarningOutlined,
  LoginOutlined,
  LogoutOutlined,
  SettingOutlined,
  PlusOutlined,
  SafetyOutlined,
  EyeOutlined,
  CoffeeOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { 
  Card, Button, Table, Tag, DatePicker, Select, Input, Space, message, 
  Modal, Form, Row, Col, Statistic, TimePicker, Alert, Tooltip, Descriptions, Divider 
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

interface Employee {
  id: number;
  fullName: string;
  employeeCode: string;
  email: string;
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
  hasApprovedLeave?: boolean; // New field to check if employee has approved leave
}

interface AttendanceProps {
  role: 'ROLE_ADMIN' | 'ROLE_MANAGER';
}

export default function ComprehensiveAttendancePage({ role }: AttendanceProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const t = useTranslations('attendance');
  
  // Form instances
  const [checkInForm] = Form.useForm();
  const [checkOutForm] = Form.useForm();
  const [absentForm] = Form.useForm();
  const [latencyForm] = Form.useForm();
  const [earlyDepartureForm] = Form.useForm();
  const [leaveForm] = Form.useForm();
  const [defaultTimesForm] = Form.useForm();
  
  // State
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Default times (these could be stored in localStorage or backend)
  const [defaultCheckInTime, setDefaultCheckInTime] = useState<string>('08:00');
  const [defaultCheckOutTime, setDefaultCheckOutTime] = useState<string>('17:00');
  
  // Modal states
  const [checkInModal, setCheckInModal] = useState(false);
  const [checkOutModal, setCheckOutModal] = useState(false);
  const [absentModal, setAbsentModal] = useState(false);
  const [latencyModal, setLatencyModal] = useState(false);
  const [earlyDepartureModal, setEarlyDepartureModal] = useState(false);
  const [leaveModal, setLeaveModal] = useState(false);
  const [defaultTimesModal, setDefaultTimesModal] = useState(false);
  const [detailsModal, setDetailsModal] = useState(false);

  // Fetch departments
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiClient.getDepartments(),
  });

  // Fetch employees with attendance
  const { data: employeesData, isLoading, refetch } = useQuery({
    queryKey: ['employees-attendance', selectedDate, selectedDepartment, searchQuery],
    queryFn: async () => {
      const response = await apiClient.getAllEmployeesWithAttendance({
        date: selectedDate,
        departmentId: selectedDepartment,
        search: searchQuery
      });
      
      // Check for approved leaves for each employee
      if (response?.employees) {
        const employeesWithLeaveStatus = await Promise.all(
          response.employees.map(async (emp: Employee) => {
            try {
              const leaveResponse = await apiClient.checkEmployeeLeave(emp.id, selectedDate);
              return {
                ...emp,
                hasApprovedLeave: leaveResponse?.hasLeave || false
              };
            } catch {
              return { ...emp, hasApprovedLeave: false };
            }
          })
        );
        return { ...response, employees: employeesWithLeaveStatus };
      }
      return response;
    },
  });

  const employees: Employee[] = employeesData?.employees || [];

  // Calculate statistics
  const stats = {
    total: employees.length,
    present: employees.filter(e => e.attendance && (e.attendance.status === 'present' || e.attendance.status === 'late')).length,
    absent: employees.filter(e => e.attendance && e.attendance.status === 'absent').length,
    late: employees.filter(e => e.attendance && e.attendance.isLate).length,
    onLeave: employees.filter(e => e.hasApprovedLeave || e.attendance?.status === 'on_leave').length,
    earlyDepartures: employees.filter(e => e.attendance && e.attendance.isEarlyDeparture).length,
    notMarked: employees.filter(e => !e.attendance && !e.hasApprovedLeave).length
  };

  // Mutations
  const checkInMutation = useMutation({
    mutationFn: (data: any) => {
      // Add flag to skip global error handling since we handle errors locally
      return apiClient.markEmployeeCheckIn(data);
    },
    onSuccess: (response) => {
      if (response.data.success !== false) {
        const msg = response.data.message || t('checkInSuccess');
        message.success(msg);
        setCheckInModal(false);
        checkInForm.resetFields();
        refetch();
      } else {
        message.error(response.data.message || t('checkInError'));
      }
    },
    onError: (error: any) => {
      console.error('Check-in error details:', error);
      let errorMessage = t('checkInError');

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        errorMessage = error.response.data.errors.join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
    }
  });

  const checkOutMutation = useMutation({
    mutationFn: (data: any) => {
      // Add flag to skip global error handling since we handle errors locally
      return apiClient.markEmployeeCheckOut(data);
    },
    onSuccess: (response) => {
      if (response.data.success !== false) {
        const msg = response.data.message || t('checkOutSuccess');
        message.success(msg);
        setCheckOutModal(false);
        checkOutForm.resetFields();
        refetch();
      } else {
        message.error(response.data.message || t('checkOutError'));
      }
    },
    onError: (error: any) => {
      console.error('Check-out error details:', error);
      let errorMessage = t('checkOutError');

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        errorMessage = error.response.data.errors.join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
    }
  });

  const markAbsentMutation = useMutation({
    mutationFn: (data: any) => {
      // Add flag to skip global error handling since we handle errors locally
      return apiClient.markEmployeeAbsent(data);
    },
    onSuccess: (response) => {
      if (response.data.success !== false) {
        const msg = response.data.message || t('markedAbsentSuccess');
        message.success(msg);
        setAbsentModal(false);
        absentForm.resetFields();
        refetch();
      } else {
        message.error(response.data.message || t('markAbsentError'));
      }
    },
    onError: (error: any) => {
      console.error('Mark absent error details:', error);
      let errorMessage = t('markAbsentError');

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        errorMessage = error.response.data.errors.join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
    }
  });

  const addLatencyMutation = useMutation({
    mutationFn: (data: any) => {
      // Add flag to skip global error handling since we handle errors locally
      return apiClient.addLatency(data);
    },
    onSuccess: (response) => {
      if (response.data.success !== false) {
        const msg = response.data.message || t('latencyAddedSuccess');
        message.success(msg);
        setLatencyModal(false);
        latencyForm.resetFields();
        refetch();
      } else {
        message.error(response.data.message || t('addLatencyError'));
      }
    },
    onError: (error: any) => {
      console.error('Add latency error details:', error);
      let errorMessage = t('addLatencyError');

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        errorMessage = error.response.data.errors.join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
    }
  });

  const addEarlyDepartureMutation = useMutation({
    mutationFn: (data: any) => {
      // Add flag to skip global error handling since we handle errors locally
      return apiClient.addEarlyDeparture(data);
    },
    onSuccess: (response) => {
      if (response.data.success !== false) {
        const msg = response.data.message || t('earlyDepartureAddedSuccess');
        message.success(msg);
        setEarlyDepartureModal(false);
        earlyDepartureForm.resetFields();
        refetch();
      } else {
        message.error(response.data.message || t('addEarlyDepartureError'));
      }
    },
    onError: (error: any) => {
      console.error('Add early departure error details:', error);
      let errorMessage = t('addEarlyDepartureError');

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        errorMessage = error.response.data.errors.join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
    }
  });

  const addLeaveMutation = useMutation({
    mutationFn: (data: any) => apiClient.addPartialLeave(data),
    onSuccess: () => {
      message.success(t('leaveAddedSuccess'));
      setLeaveModal(false);
      leaveForm.resetFields();
      refetch();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || t('addLeaveError'));
    }
  });

  // Handlers
  const handleCheckIn = (employee: Employee) => {
    setSelectedEmployee(employee);
    const [hours, minutes] = defaultCheckInTime.split(':');
    checkInForm.setFieldsValue({
      checkInTime: dayjs().hour(parseInt(hours)).minute(parseInt(minutes)),
      location: t('office'),
      notes: ''
    });
    setCheckInModal(true);
  };

  const handleCheckOut = (employee: Employee) => {
    setSelectedEmployee(employee);
    const [hours, minutes] = defaultCheckOutTime.split(':');
    checkOutForm.setFieldsValue({
      checkOutTime: dayjs().hour(parseInt(hours)).minute(parseInt(minutes)),
      location: t('office'),
      notes: ''
    });
    setCheckOutModal(true);
  };

  const handleMarkAbsent = (employee: Employee) => {
    setSelectedEmployee(employee);
    absentForm.resetFields();
    setAbsentModal(true);
  };

  const handleAddLatency = (employee: Employee) => {
    setSelectedEmployee(employee);
    latencyForm.resetFields();
    setLatencyModal(true);
  };

  const handleAddEarlyDeparture = (employee: Employee) => {
    setSelectedEmployee(employee);
    earlyDepartureForm.resetFields();
    setEarlyDepartureModal(true);
  };

  const handleAddLeave = (employee: Employee) => {
    setSelectedEmployee(employee);
    leaveForm.setFieldsValue({
      startTime: dayjs().hour(12).minute(0),
      endTime: dayjs().hour(13).minute(0),
    });
    setLeaveModal(true);
  };

  const handleSaveDefaultTimes = () => {
    defaultTimesForm.validateFields().then(values => {
      const checkIn = values.checkInTime.format('HH:mm');
      const checkOut = values.checkOutTime.format('HH:mm');
      
      setDefaultCheckInTime(checkIn);
      setDefaultCheckOutTime(checkOut);
      
      // Store in localStorage
      localStorage.setItem('defaultCheckInTime', checkIn);
      localStorage.setItem('defaultCheckOutTime', checkOut);
      
      message.success(`Default times updated! Check-in: ${checkIn}, Check-out: ${checkOut}`);
      setDefaultTimesModal(false);
    });
  };

  // Format minutes to hours and minutes (e.g., 122 minutes -> "2h 2m")
  const formatMinutes = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getStatusTag = (employee: Employee) => {
    // Permission status - ORANGE
    if (employee.hasApprovedLeave) {
      return <Tag icon={<SafetyOutlined />} color="orange">PERMISSION</Tag>;
    }
    
    if (!employee.attendance) {
      return <Tag icon={<ClockCircleOutlined />} color="default">Not Marked</Tag>;
    }
    
    const { status, isLate, lateMinutes } = employee.attendance;
    
    if (status === 'on_leave') {
      return <Tag icon={<SafetyOutlined />} color="orange">ON LEAVE</Tag>;
    }
    
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
      title: 'Employee',
      key: 'employee',
      fixed: 'left',
      width: 180,
      render: (_, employee) => (
        <div>
          <div className="font-medium text-sm">{employee.fullName}</div>
          <div className="text-gray-500 text-xs">{employee.employeeCode}</div>
        </div>
      )
    },
    {
      title: 'Dept',
      key: 'department',
      width: 120,
      render: (_, employee) => (
        <span className="text-xs">{employee.department || 'N/A'}</span>
      )
    },
    {
      title: 'Check In',
      key: 'checkIn',
      width: 90,
      render: (_, employee) => {
        if (employee.hasApprovedLeave) {
          return <Tag color="orange" className="text-xs">PERMISSION</Tag>;
        }
        if (employee.attendance?.status === 'absent') {
          return <Tag color="error" className="text-xs">ABSENT</Tag>;
        }
        return employee.attendance?.checkIn ? 
          <span className="text-xs">{dayjs(employee.attendance.checkIn).format('HH:mm')}</span> : 
          <span className="text-gray-400 text-xs">-</span>;
      }
    },
    {
      title: 'Check Out',
      key: 'checkOut',
      width: 90,
      render: (_, employee) => {
        if (employee.hasApprovedLeave) {
          return <Tag color="orange" className="text-xs">PERMISSION</Tag>;
        }
        if (employee.attendance?.status === 'absent') {
          return <Tag color="error" className="text-xs">ABSENT</Tag>;
        }
        return employee.attendance?.checkOut ? 
          <span className="text-xs">{dayjs(employee.attendance.checkOut).format('HH:mm')}</span> : 
          <span className="text-gray-400 text-xs">-</span>;
      }
    },
    {
      title: 'Hours',
      key: 'hours',
      width: 80,
      render: (_, employee) => {
        if (employee.hasApprovedLeave) {
          return <Tag color="orange" className="text-xs">PERMISSION</Tag>;
        }
        if (employee.attendance?.status === 'absent') {
          return <Tag color="error" className="text-xs">ABSENT</Tag>;
        }
        if (!employee.attendance?.workingHours) return <span className="text-xs text-gray-400">-</span>;
        const hours = Math.floor(employee.attendance.workingHours / 60);
        const mins = employee.attendance.workingHours % 60;
        return <span className="text-xs">{hours}h {mins}m</span>;
      }
    },
    {
      title: 'Late/Early',
      key: 'latency',
      width: 120,
      render: (_, employee) => {
        if (employee.hasApprovedLeave) {
          return <Tag color="orange" className="text-xs">PERMISSION</Tag>;
        }
        if (employee.attendance?.status === 'absent') {
          return <Tag color="error" className="text-xs">ABSENT</Tag>;
        }
        if (!employee.attendance) return <span className="text-xs text-gray-400">-</span>;
        return (
          <div className="flex flex-col gap-1">
            {employee.attendance.isLate && (
              <Tag color="warning" className="text-xs m-0">
                Late: {formatMinutes(employee.attendance.lateMinutes)}
              </Tag>
            )}
            {employee.attendance.isEarlyDeparture && (
              <Tag color="orange" className="text-xs m-0">
                Early: {formatMinutes(employee.attendance.earlyDepartureMinutes)}
              </Tag>
            )}
            {!employee.attendance.isLate && !employee.attendance.isEarlyDeparture && (
              <Tag color="success" className="text-xs m-0">On Time</Tag>
            )}
          </div>
        );
      }
    },
    {
      title: 'Break',
      key: 'break',
      width: 80,
      render: (_, employee) => {
        if (employee.hasApprovedLeave) {
          return <Tag color="orange" className="text-xs">PERMISSION</Tag>;
        }
        if (employee.attendance?.status === 'absent') {
          return <Tag color="error" className="text-xs">ABSENT</Tag>;
        }
        if (!employee.attendance?.breakDuration || employee.attendance.breakDuration === 0) {
          return <span className="text-xs text-gray-400">-</span>;
        }
        return (
          <Tag color="purple" className="text-xs">
            {formatMinutes(employee.attendance.breakDuration)}
          </Tag>
        );
      }
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_, employee) => getStatusTag(employee)
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_, employee) => {
        // CASE 1: Employee has approved leave/permission
        if (employee.hasApprovedLeave) {
          return (
            <div className="text-center">
              <Tag color="orange" icon={<SafetyOutlined />} className="text-xs">
                ON LEAVE
              </Tag>
            </div>
          );
        }

        // CASE 2: Employee is marked absent
        if (employee.attendance?.status === 'absent') {
          return (
            <Space size="small" className="flex justify-center">
              <Tag color="error" icon={<CloseCircleOutlined />} className="text-xs">
                ABSENT
              </Tag>
              <Tooltip title="View Details">
                <Button 
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => {
                    setSelectedEmployee(employee);
                    setDetailsModal(true);
                  }}
                />
              </Tooltip>
            </Space>
          );
        }

        // CASE 3: Normal attendance operations - SIMPLE BUTTONS ONLY
        return (
          <Space size="small" wrap className="flex justify-center">
            {!employee.attendance?.checkIn ? (
              <>
                <Tooltip title="Check In">
                  <Button 
                    type="primary" 
                    size="small"
                    icon={<LoginOutlined />}
                    onClick={() => handleCheckIn(employee)}
                  />
                </Tooltip>
                <Tooltip title="Mark Absent">
                  <Button 
                    danger
                    size="small"
                    icon={<CloseCircleOutlined />}
                    onClick={() => handleMarkAbsent(employee)}
                  />
                </Tooltip>
              </>
            ) : !employee.attendance?.checkOut ? (
              <>
                <Tooltip title="Add Break/Leave">
                  <Button 
                    size="small"
                    icon={<CoffeeOutlined />}
                    style={{ color: '#9333ea', borderColor: '#9333ea' }}
                    onClick={() => handleAddLeave(employee)}
                  />
                </Tooltip>
                <Tooltip title="Check Out">
                  <Button 
                    type="primary"
                    size="small" 
                    icon={<LogoutOutlined />}
                    onClick={() => handleCheckOut(employee)}
                  />
                </Tooltip>
                {employee.attendance && (
                  <Tooltip title="View Details">
                    <Button 
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setDetailsModal(true);
                      }}
                    />
                  </Tooltip>
                )}
              </>
            ) : (
              <>
                <Tag color="success" icon={<CheckCircleOutlined />} className="text-xs">Done</Tag>
                <Tooltip title="View Details">
                  <Button 
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setDetailsModal(true);
                    }}
                  />
                </Tooltip>
              </>
            )}
          </Space>
        );
      }
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            📊 Comprehensive Attendance Management
          </h1>
          <p className="text-gray-600 mt-1">Manage attendance with full control over check-in, latency, leaves, and permissions</p>
        </div>
        <Button 
            icon={<SettingOutlined />} 
            onClick={() => {
              const [checkInH, checkInM] = defaultCheckInTime.split(':');
              const [checkOutH, checkOutM] = defaultCheckOutTime.split(':');
              defaultTimesForm.setFieldsValue({
                checkInTime: dayjs().hour(parseInt(checkInH)).minute(parseInt(checkInM)),
                checkOutTime: dayjs().hour(parseInt(checkOutH)).minute(parseInt(checkOutM)),
              });
              setDefaultTimesModal(true);
            }}
            type="primary"
          >
            Set Default Times
          </Button>
        </div>

        {/* Statistics */}
        <Row gutter={16} className="mb-6">
          <Col span={4}>
            <Card>
              <Statistic
                title="Total"
                value={stats.total}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Present"
                value={stats.present}
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Absent"
                value={stats.absent}
                valueStyle={{ color: '#cf1322' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Late"
                value={stats.late}
                valueStyle={{ color: '#faad14' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="On Leave"
                value={stats.onLeave}
                valueStyle={{ color: '#ff7a45' }}
                prefix={<SafetyOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Not Marked"
                value={stats.notMarked}
                valueStyle={{ color: '#8c8c8c' }}
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
            <Alert
              message={`Default Times: Check-in ${defaultCheckInTime} | Check-out ${defaultCheckOutTime}`}
              type="info"
              showIcon
            />
          </Space>
        </Card>

        {/* Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={employees}
            rowKey="id"
            loading={isLoading}
            scroll={{ x: 1300, y: 600 }}
            size="small"
            bordered
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total) => `Total ${total} employees`,
              position: ['bottomCenter']
            }}
          />
        </Card>

        {/* Check In Modal */}
        <Modal
          title={`✅ Check In: ${selectedEmployee?.fullName}`}
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
              const checkInDateTime = dayjs(selectedDate)
                .hour(values.checkInTime.hour())
                .minute(values.checkInTime.minute())
                .second(0);
              
              // Calculate latency: compare with default check-in time
              const [defaultHour, defaultMin] = defaultCheckInTime.split(':');
              const expectedCheckIn = dayjs(selectedDate)
                .hour(parseInt(defaultHour))
                .minute(parseInt(defaultMin));
              const actualCheckIn = checkInDateTime;
              const minutesLate = actualCheckIn.diff(expectedCheckIn, 'minute');
              
              checkInMutation.mutate({
                employeeId: selectedEmployee!.id, // employeeId is already a number
                date: selectedDate,
                checkInTime: checkInDateTime.format('YYYY-MM-DD HH:mm:ss'),
                expectedCheckInTime: expectedCheckIn.format('YYYY-MM-DD HH:mm:ss'),
                location: values.location || '',
                notes: values.notes + (minutesLate > 0 ? ` (${minutesLate} min late)` : '')
              });
            }}
          >
            <Alert
              message={`Date: ${dayjs(selectedDate).format('MMMM DD, YYYY')} | Default: ${defaultCheckInTime}`}
              type="info"
              showIcon
              className="mb-4"
            />
            <Form.Item 
              name="checkInTime" 
              label="Check-in Time" 
              rules={[{ required: true }]}
            >
              <TimePicker format="HH:mm" style={{ width: '100%' }} size="large" />
            </Form.Item>
            <Form.Item name="location" label="Location" rules={[{ required: true }]}>
              <Input placeholder="e.g., Main Office" />
            </Form.Item>
            <Form.Item name="notes" label="Notes">
              <Input.TextArea rows={2} placeholder="Optional notes..." />
            </Form.Item>
          </Form>
        </Modal>

        {/* Check Out Modal */}
        <Modal
          title={`🚪 Check Out: ${selectedEmployee?.fullName}`}
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
              const checkOutDateTime = dayjs(selectedDate)
                .hour(values.checkOutTime.hour())
                .minute(values.checkOutTime.minute())
                .second(0);
              
              // Calculate early departure: compare with default check-out time
              const [defaultHour, defaultMin] = defaultCheckOutTime.split(':');
              const expectedCheckOut = dayjs(selectedDate)
                .hour(parseInt(defaultHour))
                .minute(parseInt(defaultMin));
              const actualCheckOut = checkOutDateTime;
              const minutesEarly = expectedCheckOut.diff(actualCheckOut, 'minute');
              
              checkOutMutation.mutate({
                employeeId: selectedEmployee!.id,
                checkOutTime: checkOutDateTime.toISOString(),
                expectedCheckOutTime: expectedCheckOut.toISOString(), // Send expected time
                location: values.location,
                notes: values.notes + (minutesEarly > 0 ? ` (${minutesEarly} min early)` : '')
              });
            }}
          >
            <Alert
              message={`Date: ${dayjs(selectedDate).format('MMMM DD, YYYY')} | Default: ${defaultCheckOutTime}`}
              type="info"
              showIcon
              className="mb-4"
            />
            <Form.Item 
              name="checkOutTime" 
              label="Check-out Time" 
              rules={[{ required: true }]}
            >
              <TimePicker format="HH:mm" style={{ width: '100%' }} size="large" />
            </Form.Item>
            <Form.Item name="location" label="Location" rules={[{ required: true }]}>
              <Input placeholder="e.g., Main Office" />
            </Form.Item>
            <Form.Item name="notes" label="Notes">
              <Input.TextArea rows={2} placeholder="Optional notes..." />
            </Form.Item>
          </Form>
        </Modal>

        {/* Mark Absent Modal */}
        <Modal
          title={`❌ Mark Absent: ${selectedEmployee?.fullName}`}
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
              <Input.TextArea rows={4} placeholder="Enter reason for absence..." />
            </Form.Item>
          </Form>
        </Modal>

        {/* Add Latency Modal */}
        <Modal
          title={`⏰ Add Latency: ${selectedEmployee?.fullName}`}
          open={latencyModal}
          onCancel={() => setLatencyModal(false)}
          onOk={() => latencyForm.submit()}
          confirmLoading={addLatencyMutation.isPending}
        >
          <Form
            form={latencyForm}
            layout="vertical"
            onFinish={(values) => {
              addLatencyMutation.mutate({
                employeeId: selectedEmployee!.id,
                attendanceId: selectedEmployee!.attendance?.id,
                date: selectedDate,
                lateMinutes: values.lateMinutes,
                reason: values.reason
              });
            }}
          >
            <Alert
              message="Add Late Arrival"
              description="Specify how many minutes the employee was late. This will be added to their attendance record."
              type="warning"
              showIcon
              className="mb-4"
            />
            <Form.Item 
              name="lateMinutes" 
              label="Late Minutes" 
              rules={[{ required: true, message: 'Please enter minutes' }]}
            >
              <Input 
                type="number" 
                placeholder="e.g., 30" 
                suffix="minutes"
                size="large"
              />
            </Form.Item>
            <Form.Item name="reason" label="Reason">
              <Input.TextArea rows={2} placeholder="Reason for latency..." />
            </Form.Item>
          </Form>
        </Modal>

        {/* Add Early Departure Modal */}
        <Modal
          title={`🏃 Add Early Departure: ${selectedEmployee?.fullName}`}
          open={earlyDepartureModal}
          onCancel={() => setEarlyDepartureModal(false)}
          onOk={() => earlyDepartureForm.submit()}
          confirmLoading={addEarlyDepartureMutation.isPending}
        >
          <Form
            form={earlyDepartureForm}
            layout="vertical"
            onFinish={(values) => {
              addEarlyDepartureMutation.mutate({
                employeeId: selectedEmployee!.id,
                attendanceId: selectedEmployee!.attendance?.id,
                date: selectedDate,
                earlyMinutes: values.earlyMinutes,
                reason: values.reason
              });
            }}
          >
            <Alert
              message="Add Early Departure"
              description="Specify how many minutes early the employee left. This will be marked in their attendance record."
              type="warning"
              showIcon
              className="mb-4"
            />
            <Form.Item 
              name="earlyMinutes" 
              label="Early Departure Minutes" 
              rules={[{ required: true, message: 'Please enter minutes' }]}
            >
              <Input 
                type="number" 
                placeholder="e.g., 60" 
                suffix="minutes"
                size="large"
              />
            </Form.Item>
            <Form.Item name="reason" label="Reason">
              <Input.TextArea rows={2} placeholder="Reason for early departure..." />
            </Form.Item>
          </Form>
        </Modal>

        {/* Add Break/Leave Period Modal */}
        <Modal
          title={`☕ Add Break/Leave: ${selectedEmployee?.fullName}`}
          open={leaveModal}
          onCancel={() => setLeaveModal(false)}
          onOk={() => leaveForm.submit()}
          confirmLoading={addLeaveMutation.isPending}
          width={600}
        >
          <Form
            form={leaveForm}
            layout="vertical"
            onFinish={(values) => {
              const startDateTime = dayjs(selectedDate)
                .hour(values.startTime.hour())
                .minute(values.startTime.minute());
              
              const endDateTime = dayjs(selectedDate)
                .hour(values.endTime.hour())
                .minute(values.endTime.minute());
              
              addLeaveMutation.mutate({
                employeeId: selectedEmployee!.id,
                attendanceId: selectedEmployee!.attendance?.id,
                date: selectedDate,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                reason: values.reason
              });
            }}
          >
            <Alert
              message="Break or Partial Leave"
              description="Record time when employee takes a break or leaves temporarily (e.g., lunch break 12-1 PM, doctor appointment, etc.)."
              type="info"
              showIcon
              className="mb-4"
            />
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  name="startTime" 
                  label="Break/Leave Start Time" 
                  rules={[{ required: true }]}
                >
                  <TimePicker format="HH:mm" style={{ width: '100%' }} size="large" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="endTime" 
                  label="Break/Leave End Time" 
                  rules={[{ required: true }]}
                >
                  <TimePicker format="HH:mm" style={{ width: '100%' }} size="large" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
              <Input.TextArea 
                rows={3} 
                placeholder="e.g., Lunch break, Doctor appointment, Personal matter, Bank visit..." 
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* Default Times Settings Modal */}
        <Modal
          title="⚙️ Set Default Check-in & Check-out Times"
          open={defaultTimesModal}
          onCancel={() => setDefaultTimesModal(false)}
          onOk={handleSaveDefaultTimes}
          width={500}
        >
          <Form form={defaultTimesForm} layout="vertical">
            <Alert
              message="Global Default Times"
              description="These times will be used as defaults for all employees when marking attendance."
              type="info"
              showIcon
              className="mb-4"
            />
            <Form.Item 
              name="checkInTime" 
              label="Default Check-in Time" 
              rules={[{ required: true }]}
            >
              <TimePicker format="HH:mm" style={{ width: '100%' }} size="large" />
            </Form.Item>
            <Form.Item 
              name="checkOutTime" 
              label="Default Check-out Time" 
              rules={[{ required: true }]}
            >
              <TimePicker format="HH:mm" style={{ width: '100%' }} size="large" />
            </Form.Item>
          </Form>
        </Modal>

        {/* Attendance Details Modal */}
        <Modal
          title={
            <div className="text-lg font-semibold">
              📋 Attendance Details - {selectedEmployee?.fullName}
            </div>
          }
          open={detailsModal}
          onCancel={() => setDetailsModal(false)}
          width={800}
          footer={
            <Button type="primary" onClick={() => setDetailsModal(false)}>
              Close
            </Button>
          }
        >
          {selectedEmployee && (
            <div>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Employee Code">
                  <strong>{selectedEmployee.employeeCode}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Department">
                  {selectedEmployee.department ? (
                    <Tag color="blue">{selectedEmployee.department}</Tag>
                  ) : (
                    <span className="text-gray-400">Not Assigned</span>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {selectedEmployee.email}
                </Descriptions.Item>
                <Descriptions.Item label="Date">
                  {dayjs(selectedDate).format('MMMM DD, YYYY')}
                </Descriptions.Item>
              </Descriptions>

              {selectedEmployee.hasApprovedLeave ? (
                <>
                  <Divider>Leave/Permission Status</Divider>
                  <Alert
                    message="Employee has approved leave for this date"
                    description="This employee is on official leave or has permission to be absent."
                    type="warning"
                    showIcon
                    icon={<SafetyOutlined />}
                  />
                </>
              ) : selectedEmployee.attendance ? (
                <>
                  <Divider>Attendance Information</Divider>
                  <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="Status">
                      {selectedEmployee.attendance.status === 'absent' ? (
                        <Tag color="error" icon={<CloseCircleOutlined />}>ABSENT</Tag>
                      ) : selectedEmployee.attendance.isLate ? (
                        <Tag color="warning" icon={<WarningOutlined />}>LATE</Tag>
                      ) : (
                        <Tag color="success" icon={<CheckCircleOutlined />}>PRESENT</Tag>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Location">
                      {selectedEmployee.attendance.location || 'N/A'}
                    </Descriptions.Item>
                    
                    <Descriptions.Item label="Check In Time">
                      {selectedEmployee.attendance.checkIn ? (
                        <strong>{dayjs(selectedEmployee.attendance.checkIn).format('HH:mm:ss')}</strong>
                      ) : (
                        <Tag color="default">Not Checked In</Tag>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Check Out Time">
                      {selectedEmployee.attendance.checkOut ? (
                        <strong>{dayjs(selectedEmployee.attendance.checkOut).format('HH:mm:ss')}</strong>
                      ) : (
                        <Tag color="default">Not Checked Out</Tag>
                      )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Working Hours">
                      {selectedEmployee.attendance.workingHours > 0 ? (
                        <span className="text-green-600 font-semibold">
                          {Math.floor(selectedEmployee.attendance.workingHours / 60)}h{' '}
                          {selectedEmployee.attendance.workingHours % 60}m
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Break Duration">
                      {selectedEmployee.attendance.breakDuration > 0 ? (
                        `${selectedEmployee.attendance.breakDuration} minutes`
                      ) : (
                        <span className="text-gray-400">No breaks</span>
                      )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Late Arrival">
                      {selectedEmployee.attendance.isLate ? (
                        <Tag color="warning">
                          {formatMinutes(selectedEmployee.attendance.lateMinutes)} late
                        </Tag>
                      ) : (
                        <Tag color="success">On Time</Tag>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Early Departure">
                      {selectedEmployee.attendance.isEarlyDeparture ? (
                        <Tag color="orange">
                          {formatMinutes(selectedEmployee.attendance.earlyDepartureMinutes)} early
                        </Tag>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </Descriptions.Item>

                    {selectedEmployee.attendance.overtimeMinutes > 0 && (
                      <Descriptions.Item label="Overtime" span={2}>
                        <Tag color="blue">
                          {formatMinutes(selectedEmployee.attendance.overtimeMinutes)} overtime
                        </Tag>
                      </Descriptions.Item>
                    )}

                    {selectedEmployee.attendance.notes && (
                      <Descriptions.Item label="Notes" span={2}>
                        <div className="bg-gray-50 p-3 rounded border border-gray-200">
                          {selectedEmployee.attendance.notes}
                        </div>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </>
              ) : (
                <>
                  <Divider>Attendance Information</Divider>
                  <Alert
                    message="No attendance record"
                    description="This employee has not been marked for attendance on this date."
                    type="info"
                    showIcon
                  />
                </>
              )}
            </div>
          )}
        </Modal>
    </div>
  );
}
