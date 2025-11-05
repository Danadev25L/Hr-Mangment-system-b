'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Table, Tag, Button, Space, Modal, Form, TimePicker, Input, Select, DatePicker, Row, Col, Statistic, message, Descriptions, Divider, App, Alert, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  WarningOutlined,
  LoginOutlined,
  LogoutOutlined,
  SettingOutlined,
  PlusOutlined,
  SafetyOutlined,
  EyeOutlined,
  CoffeeOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { EnhancedCard } from '@/components/ui/EnhancedCard';
import { AttendanceIllustration } from '@/components/ui/illustrations/AttendanceIllustration';
import apiClient from '@/lib/api';

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
  hasApprovedLeave?: boolean;
}

interface AttendanceListPageProps {
  role: 'ROLE_ADMIN' | 'ROLE_MANAGER';
}

export const AttendanceListPage: React.FC<AttendanceListPageProps> = ({ role }) => {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const { message: messageApi } = App.useApp();

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

  // Default times
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

  // Fetch attendance data
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance', selectedDate, selectedDepartment, searchQuery],
    queryFn: async () => {
      const response = await apiClient.getAllEmployeesWithAttendance({
        date: selectedDate,
        departmentId: selectedDepartment,
        search: searchQuery,
      });
      
      // Enrich with leave information
      if (response?.employees) {
        const enrichedData = await Promise.all(
          response.employees.map(async (emp: Employee) => {
            try {
              const leaveResponse = await apiClient.checkEmployeeLeave(emp.id, selectedDate);
              return {
                ...emp,
                hasApprovedLeave: leaveResponse?.hasLeave || false,
              };
            } catch {
              return { ...emp, hasApprovedLeave: false };
            }
          })
        );
        return { ...response, employees: enrichedData };
      }
      return response;
    },
  });

  // Calculate statistics
  const stats = useMemo(() => {
    if (!attendanceData?.employees) {
      return { total: 0, present: 0, absent: 0, late: 0, onLeave: 0, notMarked: 0 };
    }

    const employees: Employee[] = attendanceData.employees;
    const total = employees.length;
    const present = employees.filter(e => e.attendance?.status === 'PRESENT').length;
    const absent = employees.filter(e => e.attendance?.status === 'ABSENT').length;
    const late = employees.filter(e => e.attendance?.isLate).length;
    const onLeave = employees.filter(e => e.hasApprovedLeave).length;
    const notMarked = employees.filter(e => !e.attendance).length;

    return { total, present, absent, late, onLeave, notMarked };
  }, [attendanceData]);

  // Filter data
  const filteredData = useMemo(() => {
    if (!attendanceData?.employees) return [];

    // Search is already handled in the query
    return attendanceData.employees;
  }, [attendanceData]);

  // Mutations
  const markCheckInMutation = useMutation({
    mutationFn: (data: any) => apiClient.markEmployeeCheckIn(data),
    onSuccess: () => {
      messageApi.success('Check-in marked successfully');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setCheckInModal(false);
      checkInForm.resetFields();
    },
    onError: () => messageApi.error('Failed to mark check-in'),
  });

  const markCheckOutMutation = useMutation({
    mutationFn: (data: any) => apiClient.markEmployeeCheckOut(data),
    onSuccess: () => {
      messageApi.success('Check-out marked successfully');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setCheckOutModal(false);
      checkOutForm.resetFields();
    },
    onError: () => messageApi.error('Failed to mark check-out'),
  });

  const markAbsentMutation = useMutation({
    mutationFn: (data: any) => apiClient.markEmployeeAbsent(data),
    onSuccess: () => {
      messageApi.success('Marked as absent');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setAbsentModal(false);
      absentForm.resetFields();
    },
    onError: () => messageApi.error('Failed to mark absent'),
  });

  const markLatencyMutation = useMutation({
    mutationFn: (data: any) => apiClient.addLatency(data),
    onSuccess: () => {
      messageApi.success('Latency marked successfully');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setLatencyModal(false);
      latencyForm.resetFields();
    },
    onError: () => messageApi.error('Failed to mark latency'),
  });

  const markEarlyDepartureMutation = useMutation({
    mutationFn: (data: any) => apiClient.addEarlyDeparture(data),
    onSuccess: () => {
      messageApi.success('Early departure marked successfully');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setEarlyDepartureModal(false);
      earlyDepartureForm.resetFields();
    },
    onError: () => messageApi.error('Failed to mark early departure'),
  });

  const markLeaveMutation = useMutation({
    mutationFn: (data: any) => apiClient.addPartialLeave(data),
    onSuccess: () => {
      messageApi.success('Leave marked successfully');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setLeaveModal(false);
      leaveForm.resetFields();
    },
    onError: () => messageApi.error('Failed to mark leave'),
  });

  // Handlers
  const handleCheckIn = (employee: Employee) => {
    setSelectedEmployee(employee);
    checkInForm.setFieldsValue({
      checkInTime: dayjs(`${selectedDate} ${defaultCheckInTime}`, 'YYYY-MM-DD HH:mm'),
    });
    setCheckInModal(true);
  };

  const handleCheckOut = (employee: Employee) => {
    setSelectedEmployee(employee);
    checkOutForm.setFieldsValue({
      checkOutTime: dayjs(`${selectedDate} ${defaultCheckOutTime}`, 'YYYY-MM-DD HH:mm'),
    });
    setCheckOutModal(true);
  };

  const handleMarkAbsent = (employee: Employee) => {
    setSelectedEmployee(employee);
    setAbsentModal(true);
  };

  const handleMarkLatency = (employee: Employee) => {
    setSelectedEmployee(employee);
    setLatencyModal(true);
  };

  const handleMarkEarlyDeparture = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEarlyDepartureModal(true);
  };

  const handleMarkLeave = (employee: Employee) => {
    setSelectedEmployee(employee);
    setLeaveModal(true);
  };

  const handleViewDetails = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDetailsModal(true);
  };

  const onCheckInSubmit = (values: any) => {
    if (!selectedEmployee) return;
    markCheckInMutation.mutate({
      employeeId: selectedEmployee.id,
      date: selectedDate,
      checkInTime: values.checkInTime.format('YYYY-MM-DD HH:mm:ss'),
      location: values.location,
      notes: values.notes,
    });
  };

  const onCheckOutSubmit = (values: any) => {
    if (!selectedEmployee) return;
    markCheckOutMutation.mutate({
      employeeId: selectedEmployee.id,
      date: selectedDate,
      checkOutTime: values.checkOutTime.format('YYYY-MM-DD HH:mm:ss'),
      notes: values.notes,
    });
  };

  const onAbsentSubmit = (values: any) => {
    if (!selectedEmployee) return;
    markAbsentMutation.mutate({
      employeeId: selectedEmployee.id,
      date: selectedDate,
      reason: values.reason,
    });
  };

  const onLatencySubmit = (values: any) => {
    if (!selectedEmployee) return;
    markLatencyMutation.mutate({
      employeeId: selectedEmployee.id,
      date: selectedDate,
      lateMinutes: values.lateMinutes,
      reason: values.reason,
    });
  };

  const onEarlyDepartureSubmit = (values: any) => {
    if (!selectedEmployee) return;
    markEarlyDepartureMutation.mutate({
      employeeId: selectedEmployee.id,
      date: selectedDate,
      earlyMinutes: values.earlyMinutes,
      reason: values.reason,
    });
  };

  const onLeaveSubmit = (values: any) => {
    if (!selectedEmployee) return;
    markLeaveMutation.mutate({
      employeeId: selectedEmployee.id,
      date: selectedDate,
      leaveType: values.leaveType,
      reason: values.reason,
    });
  };

  const onDefaultTimesSubmit = (values: any) => {
    setDefaultCheckInTime(values.checkInTime.format('HH:mm'));
    setDefaultCheckOutTime(values.checkOutTime.format('HH:mm'));
    messageApi.success('Default times updated');
    setDefaultTimesModal(false);
  };

  // Table columns
  const columns: ColumnsType<Employee> = [
    {
      title: 'Employee',
      key: 'employee',
      width: 250,
      fixed: 'left',
      render: (_, record) => (
        <div>
          <div className="font-semibold text-gray-900 dark:text-white">
            {record.fullName}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {record.employeeCode}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            {record.department || 'No Department'}
          </div>
        </div>
      ),
    },
    {
      title: 'Shift',
      key: 'shift',
      width: 150,
      render: (_, record) => (
        record.currentShift ? (
          <div className="text-sm">
            <div className="font-medium">{record.currentShift.shiftName}</div>
            <div className="text-xs text-gray-500">
              {record.currentShift.startTime} - {record.currentShift.endTime}
            </div>
          </div>
        ) : (
          <span className="text-gray-400">No shift assigned</span>
        )
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, record) => {
        if (record.hasApprovedLeave) {
          return <Tag icon={<CloseCircleOutlined />} color="error">Absent</Tag>;
        }
        if (!record.attendance) {
          return <Tag icon={<ClockCircleOutlined />} color="default">Not Marked</Tag>;
        }
        const statusMap: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
          PRESENT: { color: 'success', icon: <CheckCircleOutlined />, text: 'Present' },
          ABSENT: { color: 'error', icon: <CloseCircleOutlined />, text: 'Absent' },
          LATE: { color: 'warning', icon: <WarningOutlined />, text: 'Late' },
        };
        const status = statusMap[record.attendance.status] || statusMap.PRESENT;
        return <Tag icon={status.icon} color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: 'Check In',
      key: 'checkIn',
      width: 120,
      render: (_, record) => (
        record.attendance?.checkIn ? (
          <div className="flex items-center space-x-2">
            <LoginOutlined className="text-green-500" />
            <span>{dayjs(record.attendance.checkIn).format('HH:mm')}</span>
          </div>
        ) : (
          <span className="text-gray-400">--:--</span>
        )
      ),
    },
    {
      title: 'Check Out',
      key: 'checkOut',
      width: 120,
      render: (_, record) => (
        record.attendance?.checkOut ? (
          <div className="flex items-center space-x-2">
            <LogoutOutlined className="text-red-500" />
            <span>{dayjs(record.attendance.checkOut).format('HH:mm')}</span>
          </div>
        ) : (
          <span className="text-gray-400">--:--</span>
        )
      ),
    },
    {
      title: 'Working Hours',
      key: 'workingHours',
      width: 120,
      render: (_, record) => (
        record.attendance?.workingHours ? (
          <span className="font-medium">{record.attendance.workingHours.toFixed(2)}h</span>
        ) : (
          <span className="text-gray-400">0h</span>
        )
      ),
    },
    {
      title: 'Late',
      key: 'late',
      width: 100,
      render: (_, record) => (
        record.attendance?.isLate ? (
          <Tag color="warning">{record.attendance.lateMinutes} min</Tag>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 250,
      fixed: 'right',
      render: (_, record) => {
        // CASE 1: Employee has approved leave
        if (record.hasApprovedLeave) {
          return (
            <div className="text-center">
              <Tag color="orange" icon={<SafetyOutlined />}>ON LEAVE</Tag>
            </div>
          );
        }

        // CASE 2: Employee is marked absent
        if (record.attendance?.status === 'ABSENT') {
          return (
            <Space size="small">
              <Tag color="error" icon={<CloseCircleOutlined />}>ABSENT</Tag>
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleViewDetails(record)}
              />
            </Space>
          );
        }

        // CASE 3: Normal attendance operations
        return (
          <Space size="small" wrap>
            {!record.attendance?.checkIn ? (
              <>
                <Button
                  type="primary"
                  size="small"
                  icon={<LoginOutlined />}
                  onClick={() => handleCheckIn(record)}
                />
                <Button
                  danger
                  size="small"
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleMarkAbsent(record)}
                />
              </>
            ) : !record.attendance?.checkOut ? (
              <>
                <Button
                  size="small"
                  icon={<CoffeeOutlined />}
                  style={{ color: '#9333ea', borderColor: '#9333ea' }}
                  onClick={() => handleMarkLeave(record)}
                />
                <Button
                  type="primary"
                  size="small"
                  icon={<LogoutOutlined />}
                  onClick={() => handleCheckOut(record)}
                />
                {record.attendance && (
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewDetails(record)}
                  />
                )}
              </>
            ) : (
              <>
                <Tag color="success" icon={<CheckCircleOutlined />}>Done</Tag>
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => handleViewDetails(record)}
                />
              </>
            )}
          </Space>
        );
      }
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={t('navigation.attendance') || 'Attendance'}
        description={role === 'ROLE_ADMIN' 
          ? 'Manage attendance records for all employees' 
          : 'Manage attendance for your team'}
        icon={<AttendanceIllustration />}
        gradient="cyan"
        action={
          <Button
            icon={<SettingOutlined />}
            onClick={() => {
              defaultTimesForm.setFieldsValue({
                checkInTime: dayjs(defaultCheckInTime, 'HH:mm'),
                checkOutTime: dayjs(defaultCheckOutTime, 'HH:mm'),
              });
              setDefaultTimesModal(true);
            }}
            size="large"
            type="primary"
            ghost
          >
            Default Times
          </Button>
        }
      />

      {/* Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={4}>
          <EnhancedCard>
            <Statistic
              title="Total Employees"
              value={stats.total}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </EnhancedCard>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <EnhancedCard>
            <Statistic
              title="Present"
              value={stats.present}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </EnhancedCard>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <EnhancedCard>
            <Statistic
              title="Absent"
              value={stats.absent}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </EnhancedCard>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <EnhancedCard>
            <Statistic
              title="Late Arrivals"
              value={stats.late}
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </EnhancedCard>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <EnhancedCard>
            <Statistic
              title="On Leave"
              value={stats.onLeave}
              prefix={<SafetyOutlined style={{ color: '#ff7a45' }} />}
              valueStyle={{ color: '#ff7a45' }}
            />
          </EnhancedCard>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <EnhancedCard>
            <Statistic
              title="Not Marked"
              value={stats.notMarked}
              prefix={<ClockCircleOutlined style={{ color: '#8c8c8c' }} />}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </EnhancedCard>
        </Col>
      </Row>

      {/* Filters */}
      <FilterBar>
        <DatePicker
          value={dayjs(selectedDate)}
          onChange={(date: Dayjs | null) => setSelectedDate(date?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'))}
          format="YYYY-MM-DD"
          className="w-48"
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          style={{ width: 250 }}
        />
        <div className="ml-auto text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
          Default: Check-in {defaultCheckInTime} | Check-out {defaultCheckOutTime}
        </div>
      </FilterBar>

      {/* Table */}
      <EnhancedCard>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `Total ${total} employees`,
            showSizeChanger: true,
          }}
          scroll={{ x: 1200 }}
        />
      </EnhancedCard>

      {/* Modals */}
      {/* Check-in Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <LoginOutlined className="text-green-500" />
            <span>Mark Check-In</span>
          </div>
        }
        open={checkInModal}
        onCancel={() => setCheckInModal(false)}
        footer={null}
      >
        <Form form={checkInForm} layout="vertical" onFinish={onCheckInSubmit}>
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="font-medium">{selectedEmployee?.fullName}</div>
            <div className="text-sm text-gray-500">{selectedEmployee?.employeeCode}</div>
          </div>
          <Form.Item
            name="checkInTime"
            label="Check-In Time"
            rules={[{ required: true, message: 'Please select check-in time' }]}
          >
            <TimePicker format="HH:mm" className="w-full" />
          </Form.Item>
          <Form.Item name="location" label="Location">
            <Input placeholder="Office, Remote, etc." />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Additional notes..." />
          </Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setCheckInModal(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" icon={<LoginOutlined />}>
              Mark Check-In
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Check-out Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <LogoutOutlined className="text-red-500" />
            <span>Mark Check-Out</span>
          </div>
        }
        open={checkOutModal}
        onCancel={() => setCheckOutModal(false)}
        footer={null}
      >
        <Form form={checkOutForm} layout="vertical" onFinish={onCheckOutSubmit}>
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="font-medium">{selectedEmployee?.fullName}</div>
            <div className="text-sm text-gray-500">{selectedEmployee?.employeeCode}</div>
          </div>
          <Form.Item
            name="checkOutTime"
            label="Check-Out Time"
            rules={[{ required: true, message: 'Please select check-out time' }]}
          >
            <TimePicker format="HH:mm" className="w-full" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Additional notes..." />
          </Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setCheckOutModal(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" icon={<LogoutOutlined />}>
              Mark Check-Out
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Absent Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <CloseCircleOutlined className="text-red-500" />
            <span>Mark Absent</span>
          </div>
        }
        open={absentModal}
        onCancel={() => setAbsentModal(false)}
        footer={null}
      >
        <Form form={absentForm} layout="vertical" onFinish={onAbsentSubmit}>
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="font-medium">{selectedEmployee?.fullName}</div>
            <div className="text-sm text-gray-500">{selectedEmployee?.employeeCode}</div>
          </div>
          <Form.Item
            name="reason"
            label="Reason"
            rules={[{ required: true, message: 'Please provide a reason' }]}
          >
            <Input.TextArea rows={3} placeholder="Reason for absence..." />
          </Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setAbsentModal(false)}>Cancel</Button>
            <Button type="primary" danger htmlType="submit" icon={<CloseCircleOutlined />}>
              Mark Absent
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Default Times Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <SettingOutlined />
            <span>Set Default Times</span>
          </div>
        }
        open={defaultTimesModal}
        onCancel={() => setDefaultTimesModal(false)}
        footer={null}
      >
        <Form form={defaultTimesForm} layout="vertical" onFinish={onDefaultTimesSubmit}>
          <Form.Item
            name="checkInTime"
            label="Default Check-In Time"
            rules={[{ required: true, message: 'Please select default check-in time' }]}
          >
            <TimePicker format="HH:mm" className="w-full" />
          </Form.Item>
          <Form.Item
            name="checkOutTime"
            label="Default Check-Out Time"
            rules={[{ required: true, message: 'Please select default check-out time' }]}
          >
            <TimePicker format="HH:mm" className="w-full" />
          </Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setDefaultTimesModal(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" icon={<SettingOutlined />}>
              Save Settings
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Details Modal */}
      <Modal
        title="Attendance Details"
        open={detailsModal}
        onCancel={() => setDetailsModal(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsModal(false)}>
            Close
          </Button>,
        ]}
        width={700}
      >
        {selectedEmployee && (
          <>
            <Descriptions column={2} bordered size="small" className="mb-4">
              <Descriptions.Item label="Employee">
                {selectedEmployee.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Employee Code">
                {selectedEmployee.employeeCode}
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                {selectedEmployee.department || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Date">
                {dayjs(selectedDate).format('MMMM DD, YYYY')}
              </Descriptions.Item>
            </Descriptions>

            {selectedEmployee.attendance && (
              <>
                <Divider>Attendance Information</Divider>
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="Status">
                    <Tag color={
                      selectedEmployee.attendance.status === 'PRESENT' ? 'success' :
                      selectedEmployee.attendance.status === 'ABSENT' ? 'error' : 'warning'
                    }>
                      {selectedEmployee.attendance.status}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Working Hours">
                    {selectedEmployee.attendance.workingHours?.toFixed(2) || '0'} hours
                  </Descriptions.Item>
                  <Descriptions.Item label="Check-In">
                    {selectedEmployee.attendance.checkIn 
                      ? dayjs(selectedEmployee.attendance.checkIn).format('HH:mm:ss')
                      : 'Not checked in'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Check-Out">
                    {selectedEmployee.attendance.checkOut 
                      ? dayjs(selectedEmployee.attendance.checkOut).format('HH:mm:ss')
                      : 'Not checked out'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Late">
                    {selectedEmployee.attendance.isLate 
                      ? `Yes (${selectedEmployee.attendance.lateMinutes} minutes)`
                      : 'No'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Early Departure">
                    {selectedEmployee.attendance.isEarlyDeparture 
                      ? `Yes (${selectedEmployee.attendance.earlyDepartureMinutes} minutes)`
                      : 'No'}
                  </Descriptions.Item>
                  {selectedEmployee.attendance.overtimeMinutes > 0 && (
                    <Descriptions.Item label="Overtime" span={2}>
                      {selectedEmployee.attendance.overtimeMinutes} minutes
                    </Descriptions.Item>
                  )}
                  {selectedEmployee.attendance.location && (
                    <Descriptions.Item label="Location" span={2}>
                      {selectedEmployee.attendance.location}
                    </Descriptions.Item>
                  )}
                  {selectedEmployee.attendance.notes && (
                    <Descriptions.Item label="Notes" span={2}>
                      {selectedEmployee.attendance.notes}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </>
            )}
          </>
        )}
      </Modal>

      {/* Latency Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <WarningOutlined className="text-yellow-500" />
            <span>Add Latency</span>
          </div>
        }
        open={latencyModal}
        onCancel={() => setLatencyModal(false)}
        footer={null}
      >
        <Form form={latencyForm} layout="vertical" onFinish={onLatencySubmit}>
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="font-medium">{selectedEmployee?.fullName}</div>
            <div className="text-sm text-gray-500">{selectedEmployee?.employeeCode}</div>
          </div>
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
            <Input type="number" placeholder="e.g., 30" suffix="minutes" />
          </Form.Item>
          <Form.Item name="reason" label="Reason">
            <Input.TextArea rows={2} placeholder="Reason for latency..." />
          </Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setLatencyModal(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" icon={<WarningOutlined />}>
              Add Latency
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Early Departure Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <LogoutOutlined className="text-orange-500" />
            <span>Add Early Departure</span>
          </div>
        }
        open={earlyDepartureModal}
        onCancel={() => setEarlyDepartureModal(false)}
        footer={null}
      >
        <Form form={earlyDepartureForm} layout="vertical" onFinish={onEarlyDepartureSubmit}>
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="font-medium">{selectedEmployee?.fullName}</div>
            <div className="text-sm text-gray-500">{selectedEmployee?.employeeCode}</div>
          </div>
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
            <Input type="number" placeholder="e.g., 60" suffix="minutes" />
          </Form.Item>
          <Form.Item name="reason" label="Reason">
            <Input.TextArea rows={2} placeholder="Reason for early departure..." />
          </Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setEarlyDepartureModal(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" icon={<LogoutOutlined />}>
              Add Early Departure
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Leave/Break Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <CoffeeOutlined className="text-purple-500" />
            <span>Add Break/Leave Period</span>
          </div>
        }
        open={leaveModal}
        onCancel={() => setLeaveModal(false)}
        footer={null}
        width={600}
      >
        <Form form={leaveForm} layout="vertical" onFinish={onLeaveSubmit}>
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="font-medium">{selectedEmployee?.fullName}</div>
            <div className="text-sm text-gray-500">{selectedEmployee?.employeeCode}</div>
          </div>
          <Alert
            message="Break or Partial Leave"
            description="Record time when employee takes a break or leaves temporarily (e.g., lunch break, doctor appointment, etc.)."
            type="info"
            showIcon
            className="mb-4"
          />
          <Form.Item
            name="leaveType"
            label="Leave Type"
            rules={[{ required: true, message: 'Please select leave type' }]}
          >
            <Select placeholder="Select leave type">
              <Option value="LUNCH_BREAK">Lunch Break</Option>
              <Option value="COFFEE_BREAK">Coffee Break</Option>
              <Option value="DOCTOR_APPOINTMENT">Doctor Appointment</Option>
              <Option value="PERSONAL_MATTER">Personal Matter</Option>
              <Option value="BANK_VISIT">Bank Visit</Option>
              <Option value="OTHER">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
            <Input.TextArea 
              rows={3} 
              placeholder="e.g., Lunch break, Doctor appointment, Personal matter..." 
            />
          </Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setLeaveModal(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" icon={<CoffeeOutlined />}>
              Add Break/Leave
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
