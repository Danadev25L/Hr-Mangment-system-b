'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { EnhancedCard } from '@/components/ui/EnhancedCard';
import { AttendanceIllustration } from '@/components/ui/illustrations/AttendanceIllustration';
import apiClient from '@/lib/api';

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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import React, { useState, useMemo } from 'react';

import { useTranslations } from 'next-intl';

import { Table, Tag, Button, Space, Modal, Form, TimePicker, Input, Select, DatePicker, Row, Col, Statistic, message, Descriptions, Divider, App, Alert, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import dayjs, { Dayjs } from 'dayjs';

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
  const [editCheckInForm] = Form.useForm();
  const [editCheckOutForm] = Form.useForm();
  const [editBreakForm] = Form.useForm();
  const [overtimeForm] = Form.useForm();
  
  // Bulk action forms
  const [bulkCheckInForm] = Form.useForm();
  const [bulkCheckOutForm] = Form.useForm();
  const [bulkBreakForm] = Form.useForm();
  const [bulkAbsentForm] = Form.useForm();

  // State
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Bulk selection
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);

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
  const [editCheckInModal, setEditCheckInModal] = useState(false);
  const [editCheckOutModal, setEditCheckOutModal] = useState(false);
  const [editBreakModal, setEditBreakModal] = useState(false);
  const [overtimeModal, setOvertimeModal] = useState(false);
  
  // Bulk action modals
  const [bulkCheckInModal, setBulkCheckInModal] = useState(false);
  const [bulkCheckOutModal, setBulkCheckOutModal] = useState(false);
  const [bulkBreakModal, setBulkBreakModal] = useState(false);
  const [bulkAbsentModal, setBulkAbsentModal] = useState(false);

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
        return { 
          ...response, 
          employees: enrichedData,
          isHoliday: response.isHoliday || false,
          holiday: response.holiday || null
        };
      }
      return response;
    },
  });

  // Extract holiday information from response
  const isHoliday = attendanceData?.isHoliday || false;
  const holidayInfo = attendanceData?.holiday || null;

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
    mutationFn: async (data: any) => {
      return apiClient.markEmployeeCheckIn(data);
    },
    onSuccess: (response: any) => {
      if (response.success !== false) {
        const msg = response.message || 'Check-in marked successfully';
        messageApi.success(msg);
        queryClient.invalidateQueries({ queryKey: ['attendance'] });
        setCheckInModal(false);
        checkInForm.resetFields();
      } else {
        messageApi.error(response.message || 'Failed to mark check-in');
      }
    },
    onError: (error: any) => {
      console.error('Check-in error details:', error);
      let errorMessage = 'Failed to mark check-in';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        errorMessage = error.response.data.errors.join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }

      messageApi.error(errorMessage);
    },
  });

  const markCheckOutMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiClient.markEmployeeCheckOut(data);
    },
    onSuccess: (response: any) => {
      if (response.success !== false) {
        const msg = response.message || 'Check-out marked successfully';
        messageApi.success(msg);
        queryClient.invalidateQueries({ queryKey: ['attendance'] });
        setCheckOutModal(false);
        checkOutForm.resetFields();
      } else {
        messageApi.error(response.message || 'Failed to mark check-out');
      }
    },
    onError: (error: any) => {
      console.error('Check-out error details:', error);
      let errorMessage = 'Failed to mark check-out';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        errorMessage = error.response.data.errors.join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }

      messageApi.error(errorMessage);
    },
  });

  const markAbsentMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiClient.markEmployeeAbsent(data);
    },
    onSuccess: (response: any) => {
      if (response.success !== false) {
        messageApi.success(response.message || 'Marked as absent');
        queryClient.invalidateQueries({ queryKey: ['attendance'] });
        setAbsentModal(false);
        absentForm.resetFields();
      } else {
        messageApi.error(response.message || 'Failed to mark absent');
      }
    },
    onError: (error: any) => {
      console.error('Mark absent error details:', error);
      let errorMessage = 'Failed to mark absent';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        errorMessage = error.response.data.errors.join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }

      messageApi.error(errorMessage);
    },
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
    mutationFn: (data: any) => apiClient.addBreakDuration(data),
    onSuccess: (response) => {
      if (response.success) {
        messageApi.success(response.message || 'Break added successfully');
      } else {
        messageApi.error(response.message || 'Failed to add break');
      }
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setLeaveModal(false);
      leaveForm.resetFields();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to add break';
      messageApi.error(errorMessage);
    },
  });

  // Edit mutations
  const editCheckInMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('=== MUTATION STARTING ===');
      console.log('Calling apiClient.editCheckInTime with:', data);
      try {
        const result = await apiClient.editCheckInTime(data);
        console.log('=== API RESPONSE RECEIVED ===');
        console.log('Response:', result);
        return result;
      } catch (err) {
        console.error('=== API CALL FAILED ===');
        console.error('Error:', err);
        throw err;
      }
    },
    onSuccess: (response) => {
      console.log('=== MUTATION SUCCESS ===');
      console.log('Response data:', response);
      console.log('response.success:', response.success);
      console.log('response.message:', response.message);
      console.log('Full response JSON:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        messageApi.success(response.message || 'Check-in time updated successfully');
        queryClient.invalidateQueries({ queryKey: ['attendance'] });
        setEditCheckInModal(false);
        editCheckInForm.resetFields();
      } else {
        // Show the actual error message from backend
        const errorMsg = response.message || response.error || 'Failed to update check-in time';
        messageApi.error(errorMsg);
        console.error('=== OPERATION FAILED ===');
        console.error('Error message:', errorMsg);
        console.error('Full response:', response);
        console.error('Response debug info:', response.debug);
        
        // Show debug info in a more visible alert if available
        if (response.debug) {
          console.error('DEBUG INFO:', JSON.stringify(response.debug, null, 2));
        }
      }
    },
    onError: (error: any) => {
      console.error('=== MUTATION ERROR ===');
      console.error('Full error:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to update check-in time';
      messageApi.error(errorMessage);
    },
  });

  const editCheckOutMutation = useMutation({
    mutationFn: (data: any) => apiClient.editCheckOutTime(data),
    onSuccess: (response) => {
      if (response.success) {
        messageApi.success(response.message || 'Check-out time updated successfully');
      } else {
        messageApi.error(response.message || 'Failed to update check-out time');
      }
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setEditCheckOutModal(false);
      editCheckOutForm.resetFields();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to update check-out time';
      messageApi.error(errorMessage);
    },
  });

  const editBreakMutation = useMutation({
    mutationFn: (data: any) => apiClient.editBreakDuration(data),
    onSuccess: (response) => {
      if (response.success) {
        messageApi.success(response.message || 'Break duration updated successfully');
      } else {
        messageApi.error(response.message || 'Failed to update break duration');
      }
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setEditBreakModal(false);
      editBreakForm.resetFields();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to update break duration';
      messageApi.error(errorMessage);
    },
  });

  const overtimeMutation = useMutation({
    mutationFn: (data: any) => apiClient.addAttendanceOvertime(data),
    onSuccess: (response) => {
      if (response.success) {
        messageApi.success(response.message || 'Overtime added/updated successfully');
      } else {
        messageApi.error(response.message || 'Failed to add/update overtime');
      }
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setOvertimeModal(false);
      overtimeForm.resetFields();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to add/update overtime';
      messageApi.error(errorMessage);
    },
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

  // Edit handlers
  const handleEditCheckIn = (employee: Employee) => {
    if (!employee.attendance?.checkIn) {
      messageApi.error('Employee has not checked in yet');
      return;
    }
    
    setSelectedEmployee(employee);
    editCheckInForm.setFieldsValue({
      checkInTime: dayjs(employee.attendance.checkIn),
    });
    setEditCheckInModal(true);
  };

  const handleEditCheckOut = (employee: Employee) => {
    if (!employee.attendance?.checkOut) {
      messageApi.error('Employee has not checked out yet');
      return;
    }
    
    setSelectedEmployee(employee);
    editCheckOutForm.setFieldsValue({
      checkOutTime: dayjs(employee.attendance.checkOut),
    });
    setEditCheckOutModal(true);
  };

  const handleEditBreak = (employee: Employee) => {
    if (!employee.attendance) {
      messageApi.error('No attendance record found');
      return;
    }
    
    setSelectedEmployee(employee);
    if (employee.attendance.breakDuration) {
      const hours = employee.attendance.breakDuration / 60;
      editBreakForm.setFieldsValue({
        breakDuration: hours.toString(),
      });
    }
    setEditBreakModal(true);
  };

  const handleAddOvertime = (employee: Employee) => {
    if (!employee.attendance) {
      messageApi.error('No attendance record found');
      return;
    }
    
    setSelectedEmployee(employee);
    overtimeForm.resetFields();
    setOvertimeModal(true);
  };

  const handleEditOvertime = (employee: Employee) => {
    if (!employee.attendance) {
      messageApi.error('No attendance record found');
      return;
    }
    
    setSelectedEmployee(employee);
    if (employee.attendance.overtimeMinutes) {
      const hours = employee.attendance.overtimeMinutes / 60;
      overtimeForm.setFieldsValue({
        overtimeHours: hours.toString(),
      });
    }
    setOvertimeModal(true);
  };

  const onCheckInSubmit = (values: any) => {
    if (!selectedEmployee) return;

    // Validate required fields
    if (!values.checkInTime) {
      messageApi.error('Check-in time is required');
      return;
    }

    // Send the expected check-in time (default time) to backend for late calculation
    const expectedCheckIn = dayjs(`${selectedDate} ${defaultCheckInTime}`, 'YYYY-MM-DD HH:mm');

    markCheckInMutation.mutate({
      employeeId: Number(selectedEmployee.id), // Ensure employeeId is a number
      date: selectedDate,
      checkInTime: values.checkInTime.format('YYYY-MM-DD HH:mm:ss'),
      expectedCheckInTime: expectedCheckIn.format('YYYY-MM-DD HH:mm:ss'),
      location: values.location || '',
      notes: values.notes || '',
    });
  };

  const onCheckOutSubmit = (values: any) => {
    if (!selectedEmployee) return;
    // Send the expected check-out time (default time) to backend for early departure calculation
    const expectedCheckOut = dayjs(`${selectedDate} ${defaultCheckOutTime}`, 'YYYY-MM-DD HH:mm');
    markCheckOutMutation.mutate({
      employeeId: selectedEmployee.id,
      date: selectedDate,
      checkOutTime: values.checkOutTime.format('YYYY-MM-DD HH:mm:ss'),
      expectedCheckOutTime: expectedCheckOut.format('YYYY-MM-DD HH:mm:ss'),
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
    
    // Send hours directly to backend - let backend do ALL calculations
    markLeaveMutation.mutate({
      employeeId: selectedEmployee.id,
      date: selectedDate,
      breakDurationHours: parseFloat(values.breakDuration), // Backend will convert to minutes
      breakType: values.leaveType,
      reason: values.reason || '',
    });
  };

  const onDefaultTimesSubmit = (values: any) => {
    setDefaultCheckInTime(values.checkInTime.format('HH:mm'));
    setDefaultCheckOutTime(values.checkOutTime.format('HH:mm'));
    messageApi.success('Default times updated');
    setDefaultTimesModal(false);
  };

  // Edit submit handlers - Enhanced with attendanceId support
  const onEditCheckInSubmit = (values: any) => {
    if (!selectedEmployee) return;
    
    // DEBUG: Log what we're sending
    console.log('=== FRONTEND EDIT CHECK-IN ===');
    console.log('selectedEmployee:', selectedEmployee);
    console.log('selectedEmployee.attendance:', selectedEmployee.attendance);
    console.log('selectedEmployee.attendance?.id:', selectedEmployee.attendance?.id);
    
    // Use attendanceId if available, otherwise use employeeId + date
    const requestData: any = {
      checkInTime: values.checkInTime.format('YYYY-MM-DD HH:mm:ss'),
      reason: values.reason || 'Admin edited check-in time'
    };

    if (selectedEmployee.attendance?.id) {
      requestData.attendanceId = selectedEmployee.attendance.id;
      console.log('Using attendanceId:', requestData.attendanceId);
    } else {
      requestData.employeeId = selectedEmployee.id;
      requestData.date = selectedDate;
      console.log('Using employeeId + date:', requestData.employeeId, requestData.date);
    }

    // Add expected time for late calculation
    if (defaultCheckInTime) {
      const expectedCheckIn = dayjs(`${selectedDate} ${defaultCheckInTime}`, 'YYYY-MM-DD HH:mm');
      requestData.expectedCheckInTime = expectedCheckIn.format('YYYY-MM-DD HH:mm:ss');
    }
    
    console.log('Final requestData:', requestData);
    editCheckInMutation.mutate(requestData);
  };

  const onEditCheckOutSubmit = (values: any) => {
    if (!selectedEmployee) return;
    
    // Use attendanceId if available, otherwise use employeeId + date
    const requestData: any = {
      checkOutTime: values.checkOutTime.format('YYYY-MM-DD HH:mm:ss'),
      reason: values.reason || 'Admin edited check-out time'
    };

    if (selectedEmployee.attendance?.id) {
      requestData.attendanceId = selectedEmployee.attendance.id;
    } else {
      requestData.employeeId = selectedEmployee.id;
      requestData.date = selectedDate;
    }

    // Add expected time for early departure/overtime calculation
    if (defaultCheckOutTime) {
      const expectedCheckOut = dayjs(`${selectedDate} ${defaultCheckOutTime}`, 'YYYY-MM-DD HH:mm');
      requestData.expectedCheckOutTime = expectedCheckOut.format('YYYY-MM-DD HH:mm:ss');
    }
    
    editCheckOutMutation.mutate(requestData);
  };

  const onEditBreakSubmit = (values: any) => {
    if (!selectedEmployee) return;
    
    // Use attendanceId if available, otherwise use employeeId + date
    const requestData: any = {
      breakDurationHours: parseFloat(values.breakDuration),
      reason: values.reason || 'Admin edited break duration'
    };

    if (selectedEmployee.attendance?.id) {
      requestData.attendanceId = selectedEmployee.attendance.id;
    } else {
      requestData.employeeId = selectedEmployee.id;
      requestData.date = selectedDate;
    }
    
    editBreakMutation.mutate(requestData);
  };

  const onOvertimeSubmit = (values: any) => {
    if (!selectedEmployee) return;
    
    // Use attendanceId if available, otherwise use employeeId + date
    const requestData: any = {
      overtimeHours: parseFloat(values.overtimeHours),
      reason: values.reason || 'Admin added overtime'
    };

    if (selectedEmployee.attendance?.id) {
      requestData.attendanceId = selectedEmployee.attendance.id;
    } else {
      requestData.employeeId = selectedEmployee.id;
      requestData.date = selectedDate;
    }
    
    overtimeMutation.mutate(requestData);
  };

  // Bulk action handlers
  const onBulkCheckInSubmit = async (values: any) => {
    if (selectedEmployeeIds.length === 0) return;
    
    // Don't allow bulk actions on holidays
    if (isHoliday) {
      messageApi.warning(t('attendance.holidayNoActions'));
      return;
    }
    
    try {
      // Filter out employees who shouldn't have bulk check-in applied:
      // - Already checked in
      // - On leave
      // - Marked absent
      const eligibleEmployeeIds = selectedEmployeeIds.filter(empId => {
        const employee = filteredData.find((e: Employee) => e.id === empId);
        if (!employee) return false;
        
        // Skip if already checked in
        if (employee.attendance?.checkIn) return false;
        
        // Skip if on leave
        if (employee.hasApprovedLeave) return false;
        
        // Skip if marked absent
        if (employee.attendance?.status === 'ABSENT' || employee.attendance?.status === 'absent') return false;
        
        return true;
      });

      if (eligibleEmployeeIds.length === 0) {
        messageApi.warning(t('attendance.noEligibleEmployees'));
        return;
      }

      const checkInTime = values.checkInTime.format('HH:mm');
      const promises = eligibleEmployeeIds.map(employeeId =>
        apiClient.markEmployeeCheckIn({
          employeeId,
          date: selectedDate,
          checkInTime,
          location: values.location || '',
          notes: values.notes || '',
        })
      );
      
      const results = await Promise.allSettled(promises);
      const successful = results.filter(result => result.status === 'fulfilled');
      const failed = results.filter(result => result.status === 'rejected');

      if (failed.length === 0) {
        messageApi.success(t('attendance.bulkCheckInSuccess', { count: successful.length }));
      } else {
        messageApi.warning(`Partially completed: ${successful.length} successful, ${failed.length} failed`);
      }

      // Refetch attendance data
      await queryClient.invalidateQueries({ queryKey: ['attendance'] });
      await queryClient.refetchQueries({ queryKey: ['attendance'] });
      
      setBulkCheckInModal(false);
      bulkCheckInForm.resetFields();
      setSelectedEmployeeIds([]);
    } catch (error) {
      console.error('Bulk check-in error:', error);
      messageApi.error(t('attendance.bulkCheckInError'));
    }
  };

  const onBulkCheckOutSubmit = async (values: any) => {
    if (selectedEmployeeIds.length === 0) return;
    
    // Don't allow bulk actions on holidays
    if (isHoliday) {
      messageApi.warning(t('attendance.holidayNoActions'));
      return;
    }
    
    try {
      // Filter out employees who shouldn't have bulk check-out applied:
      // - Haven't checked in yet
      // - Already checked out
      // - On leave
      // - Marked absent
      const eligibleEmployeeIds = selectedEmployeeIds.filter(empId => {
        const employee = filteredData.find((e: Employee) => e.id === empId);
        if (!employee) return false;
        
        // Must have checked in
        if (!employee.attendance?.checkIn) return false;
        
        // Skip if already checked out
        if (employee.attendance?.checkOut) return false;
        
        // Skip if on leave
        if (employee.hasApprovedLeave) return false;
        
        // Skip if marked absent
        if (employee.attendance?.status === 'ABSENT' || employee.attendance?.status === 'absent') return false;
        
        return true;
      });

      if (eligibleEmployeeIds.length === 0) {
        messageApi.warning(t('attendance.noEligibleEmployees'));
        return;
      }

      const checkOutTime = values.checkOutTime.format('HH:mm');
      const promises = eligibleEmployeeIds.map(employeeId =>
        apiClient.markEmployeeCheckOut({
          employeeId,
          date: selectedDate,
          checkOutTime,
          notes: values.notes || '',
        })
      );
      
      const results = await Promise.allSettled(promises);
      const successful = results.filter(result => result.status === 'fulfilled');
      const failed = results.filter(result => result.status === 'rejected');

      if (failed.length === 0) {
        messageApi.success(t('attendance.bulkCheckOutSuccess', { count: successful.length }));
      } else {
        messageApi.warning(`Partially completed: ${successful.length} successful, ${failed.length} failed`);
      }

      // Refetch attendance data
      await queryClient.invalidateQueries({ queryKey: ['attendance'] });
      await queryClient.refetchQueries({ queryKey: ['attendance'] });
      
      setBulkCheckOutModal(false);
      bulkCheckOutForm.resetFields();
      setSelectedEmployeeIds([]);
    } catch (error) {
      console.error('Bulk check-out error:', error);
      messageApi.error(t('attendance.bulkCheckOutError'));
    }
  };

  const onBulkBreakSubmit = async (values: any) => {
    if (selectedEmployeeIds.length === 0) return;
    
    // Don't allow bulk actions on holidays
    if (isHoliday) {
      messageApi.warning(t('attendance.holidayNoActions'));
      return;
    }
    
    try {
      // Filter out employees who shouldn't have break applied:
      // - Haven't checked in yet
      // - On leave
      // - Marked absent
      const eligibleEmployeeIds = selectedEmployeeIds.filter(empId => {
        const employee = filteredData.find((e: Employee) => e.id === empId);
        if (!employee) return false;
        
        // Must have checked in
        if (!employee.attendance?.checkIn) return false;
        
        // Skip if on leave
        if (employee.hasApprovedLeave) return false;
        
        // Skip if marked absent
        if (employee.attendance?.status === 'ABSENT' || employee.attendance?.status === 'absent') return false;
        
        return true;
      });

      if (eligibleEmployeeIds.length === 0) {
        messageApi.warning(t('attendance.noEligibleEmployees'));
        return;
      }

      const promises = eligibleEmployeeIds.map(employeeId =>
        apiClient.addBreakDuration({
          employeeId,
          date: selectedDate,
          breakDurationHours: parseFloat(values.breakDuration),
          breakType: values.breakType,
          reason: values.reason || '',
        })
      );
      
      const results = await Promise.allSettled(promises);
      const successful = results.filter(result => result.status === 'fulfilled');
      const failed = results.filter(result => result.status === 'rejected');

      if (failed.length === 0) {
        messageApi.success(t('attendance.bulkBreakSuccess', { count: successful.length }));
      } else {
        messageApi.warning(`Partially completed: ${successful.length} successful, ${failed.length} failed`);
      }

      // Refetch attendance data
      await queryClient.invalidateQueries({ queryKey: ['attendance'] });
      await queryClient.refetchQueries({ queryKey: ['attendance'] });
      
      setBulkBreakModal(false);
      bulkBreakForm.resetFields();
      setSelectedEmployeeIds([]);
    } catch (error) {
      console.error('Bulk break error:', error);
      messageApi.error(t('attendance.bulkBreakError'));
    }
  };

  const onBulkAbsentSubmit = async (values: any) => {
    if (selectedEmployeeIds.length === 0) return;
    
    // Don't allow bulk actions on holidays
    if (isHoliday) {
      messageApi.warning(t('attendance.holidayNoActions'));
      return;
    }
    
    try {
      // Filter out employees who shouldn't have bulk absent applied:
      // - Already marked absent
      // - On leave
      // - Already have attendance (checked in)
      const eligibleEmployeeIds = selectedEmployeeIds.filter(empId => {
        const employee = filteredData.find((e: Employee) => e.id === empId);
        if (!employee) return false;
        
        // Skip if already marked absent
        if (employee.attendance?.status === 'ABSENT' || employee.attendance?.status === 'absent') return false;
        
        // Skip if on leave
        if (employee.hasApprovedLeave) return false;
        
        // Skip if already checked in
        if (employee.attendance?.checkIn) return false;
        
        return true;
      });

      if (eligibleEmployeeIds.length === 0) {
        messageApi.warning(t('attendance.noEligibleEmployees'));
        return;
      }

      const promises = eligibleEmployeeIds.map(employeeId =>
        apiClient.markEmployeeAbsent({
          employeeId,
          date: selectedDate,
          reason: values.reason || '',
        })
      );
      
      const results = await Promise.allSettled(promises);
      const successful = results.filter(result => result.status === 'fulfilled');
      const failed = results.filter(result => result.status === 'rejected');

      if (failed.length === 0) {
        messageApi.success(t('attendance.bulkAbsentSuccess', { count: successful.length }));
      } else {
        messageApi.warning(`Partially completed: ${successful.length} successful, ${failed.length} failed`);
      }

      // Refetch attendance data
      await queryClient.invalidateQueries({ queryKey: ['attendance'] });
      await queryClient.refetchQueries({ queryKey: ['attendance'] });
      
      setBulkAbsentModal(false);
      bulkAbsentForm.resetFields();
      setSelectedEmployeeIds([]);
    } catch (error) {
      console.error('Bulk absent error:', error);
      messageApi.error(t('attendance.bulkAbsentError'));
    }
  };

  // Table columns
  const columns: ColumnsType<Employee> = [
    {
      title: t('common.employee'),
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
            {record.department || t('departments.title')}
          </div>
        </div>
      ),
    },
    {
      title: t('attendance.status'),
      key: 'status',
      width: 180,
      render: (_, record) => {
        // If it's a holiday, show holiday status
        if (isHoliday) {
          return <Tag icon={<CoffeeOutlined />} color="blue">{t('attendance.onHoliday')}</Tag>;
        }
        
        if (record.hasApprovedLeave) {
          return <Tag icon={<CloseCircleOutlined />} color="orange">{t('attendance.leave')}</Tag>;
        }
        if (!record.attendance) {
          return <Tag icon={<ClockCircleOutlined />} color="default">{t('attendance.notMarked')}</Tag>;
        }
        
        // Check if absent
        if (record.attendance.status === 'absent' || record.attendance.status === 'ABSENT') {
          return <Tag icon={<CloseCircleOutlined />} color="error">{t('attendance.absent')}</Tag>;
        }
        
        // Check if employee is late
        if (record.attendance.isLate && record.attendance.lateMinutes > 0) {
          const minutes = record.attendance.lateMinutes;
          let timeDisplay = '';
          if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            timeDisplay = mins > 0 ? `${hours}${t('attendance.hrs')} ${mins}${t('attendance.min')}` : `${hours}${t('attendance.hrs')}`;
          } else {
            timeDisplay = `${minutes}${t('attendance.min')}`;
          }
          
          return (
            <Tooltip title={`${t('attendance.late')} ${timeDisplay}`}>
              <Tag icon={<WarningOutlined />} color="warning">
                {t('attendance.present')} - {t('attendance.late')}
              </Tag>
            </Tooltip>
          );
        }
        
        // Check if early departure
        if (record.attendance.isEarlyDeparture && record.attendance.earlyDepartureMinutes > 0) {
          return <Tag icon={<WarningOutlined />} color="orange">{t('attendance.earlyDeparture')}</Tag>;
        }
        
        // Present and on time
        if (record.attendance.checkIn) {
          return <Tag icon={<CheckCircleOutlined />} color="success">{t('attendance.present')} - {t('attendance.onTime')}</Tag>;
        }
        
        return <Tag icon={<CheckCircleOutlined />} color="success">{t('attendance.present')}</Tag>;
      },
    },
    {
      title: t('attendance.checkIn'),
      key: 'checkIn',
      width: 150,
      render: (_, record) => {
        // If it's a holiday, show holiday text
        if (isHoliday) {
          return <span className="text-blue-500 font-medium">{t('attendance.onHoliday')}</span>;
        }
        
        // If absent, show dash
        if (record.attendance?.status === 'absent' || record.attendance?.status === 'ABSENT') {
          return <span className="text-gray-400">--:--</span>;
        }
        
        return (
          <div className="flex items-center space-x-2">
            {record.attendance?.checkIn ? (
              <>
                <LoginOutlined className="text-green-500" />
                <span>{dayjs(record.attendance.checkIn).format('HH:mm')}</span>
                {record.attendance?.id && (
                  <Button
                    type="text"
                    size="small"
                    icon={<span className="text-xs">✏️</span>}
                    onClick={() => handleEditCheckIn(record)}
                    title={t('attendance.editCheckIn')}
                  />
                )}
              </>
            ) : (
              <span className="text-gray-400">--:--</span>
            )}
          </div>
        );
      },
    },
    {
      title: t('attendance.checkOut'),
      key: 'checkOut',
      width: 150,
      render: (_, record) => {
        // If it's a holiday, show holiday text
        if (isHoliday) {
          return <span className="text-blue-500 font-medium">{t('attendance.onHoliday')}</span>;
        }
        
        // If absent, show dash
        if (record.attendance?.status === 'absent' || record.attendance?.status === 'ABSENT') {
          return <span className="text-gray-400">--:--</span>;
        }
        
        return (
          <div className="flex items-center space-x-2">
            {record.attendance?.checkOut ? (
              <>
                <LogoutOutlined className="text-red-500" />
                <span>{dayjs(record.attendance.checkOut).format('HH:mm')}</span>
                {record.attendance?.id && (
                  <Button
                    type="text"
                    size="small"
                    icon={<span className="text-xs">✏️</span>}
                    onClick={() => handleEditCheckOut(record)}
                    title={t('attendance.editCheckOut')}
                  />
                )}
              </>
            ) : (
              <span className="text-gray-400">--:--</span>
            )}
          </div>
        );
      },
    },
    {
      title: t('attendance.workingHours'),
      key: 'workingHours',
      width: 120,
      render: (_, record) => {
        // If it's a holiday, show holiday text
        if (isHoliday) {
          return <span className="text-blue-500 font-medium">{t('attendance.onHoliday')}</span>;
        }
        
        // If absent, show dash
        if (record.attendance?.status === 'absent' || record.attendance?.status === 'ABSENT') {
          return <span className="text-gray-400">-</span>;
        }
        
        if (record.attendance?.workingHours) {
          // workingHours is stored in minutes
          const totalMinutes = record.attendance.workingHours;
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          
          if (hours > 0 && minutes > 0) {
            return <span className="font-medium">{hours}h {minutes}m</span>;
          } else if (hours > 0) {
            return <span className="font-medium">{hours}h</span>;
          } else {
            return <span className="font-medium">{minutes}m</span>;
          }
        }
        return <span className="text-gray-400">0h 0m</span>;
      },
    },
    {
      title: t('attendance.break'),
      key: 'break',
      width: 130,
      render: (_, record) => {
        // If it's a holiday, show holiday text
        if (isHoliday) {
          return <span className="text-blue-500 font-medium">{t('attendance.onHoliday')}</span>;
        }
        
        // If absent, show dash
        if (record.attendance?.status === 'absent' || record.attendance?.status === 'ABSENT') {
          return <span className="text-gray-400">-</span>;
        }
        
        if (record.attendance?.breakDuration && record.attendance.breakDuration > 0) {
          const totalMinutes = record.attendance.breakDuration;
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          
          const displayText = hours > 0 
            ? (minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`)
            : `${minutes}m`;
          
          return (
            <div className="flex items-center space-x-1">
              <Tag color="purple">{displayText}</Tag>
              <Button
                type="text"
                size="small"
                icon={<span className="text-xs">✏️</span>}
                onClick={() => handleEditBreak(record)}
                title={t('attendance.editBreak')}
              />
            </div>
          );
        }
        return <span className="text-gray-400">-</span>;
      },
    },
    {
      title: t('attendance.late'),
      key: 'late',
      width: 100,
      render: (_, record) => {
        // If it's a holiday, show holiday text
        if (isHoliday) {
          return <span className="text-blue-500 font-medium">{t('attendance.onHoliday')}</span>;
        }
        
        // If absent, show dash
        if (record.attendance?.status === 'absent' || record.attendance?.status === 'ABSENT') {
          return <span className="text-gray-400">-</span>;
        }
        
        if (record.attendance?.isLate && record.attendance.lateMinutes > 0) {
          const minutes = record.attendance.lateMinutes;
          if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return <Tag color="warning">{hours}h {mins}m</Tag>;
          }
          return <Tag color="warning">{minutes} {t('attendance.min')}</Tag>;
        }
        return <span className="text-gray-400">-</span>;
      },
    },
    {
      title: t('attendance.earlyDeparture'),
      key: 'leftEarly',
      width: 110,
      render: (_, record) => {
        // If it's a holiday, show holiday text
        if (isHoliday) {
          return <span className="text-blue-500 font-medium">{t('attendance.onHoliday')}</span>;
        }
        
        // If absent, show dash
        if (record.attendance?.status === 'absent' || record.attendance?.status === 'ABSENT') {
          return <span className="text-gray-400">-</span>;
        }
        
        if (record.attendance?.isEarlyDeparture && record.attendance.earlyDepartureMinutes > 0) {
          const minutes = record.attendance.earlyDepartureMinutes;
          if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return (
              <Tooltip title={`${t('attendance.earlyDeparture')} ${hours}h ${mins}m`}>
                <Tag color="orange">{hours}h {mins}m</Tag>
              </Tooltip>
            );
          }
          return (
            <Tooltip title={`${t('attendance.earlyDeparture')} ${minutes} ${t('attendance.minutes')}`}>
              <Tag color="orange">{minutes} {t('attendance.min')}</Tag>
            </Tooltip>
          );
        }
        return <span className="text-gray-400">-</span>;
      },
    },
    {
      title: t('attendance.overtime'),
      key: 'overtime',
      width: 130,
      render: (_, record) => {
        if (record.attendance?.overtimeMinutes && record.attendance.overtimeMinutes > 0) {
          const totalMinutes = record.attendance.overtimeMinutes;
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          
          const displayText = hours > 0 
            ? (minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`)
            : `${minutes}m`;
          
          return (
            <div className="flex items-center space-x-1">
              <Tag color="blue">{displayText}</Tag>
              <Button
                type="text"
                size="small"
                icon={<span className="text-xs">✏️</span>}
                onClick={() => handleEditOvertime(record)}
                title={t('attendance.editOvertime')}
              />
            </div>
          );
        }
        return (
          <Button
            type="dashed"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => handleAddOvertime(record)}
            title={t('attendance.addOvertime')}
          >
            {t('attendance.addOvertime')}
          </Button>
        );
      },
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 250,
      fixed: 'right',
      render: (_, record) => {
        // CASE 0: If it's a holiday, disable all actions
        if (isHoliday) {
          return (
            <div className="text-center">
              <Tag color="blue" icon={<CoffeeOutlined />}>{t('attendance.holidayNoActions')}</Tag>
            </div>
          );
        }
        
        // CASE 1: Employee has approved leave
        if (record.hasApprovedLeave) {
          return (
            <div className="text-center">
              <Tag color="orange" icon={<SafetyOutlined />}>{t('attendance.leave').toUpperCase()}</Tag>
            </div>
          );
        }

        // CASE 2: Employee is marked absent
        if (record.attendance?.status === 'ABSENT') {
          return (
            <Space size="small">
              <Tag color="error" icon={<CloseCircleOutlined />}>{t('attendance.absent').toUpperCase()}</Tag>
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
                  title={t('attendance.markCheckIn')}
                />
                <Button
                  danger
                  size="small"
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleMarkAbsent(record)}
                  title={t('attendance.markAbsent')}
                />
              </>
            ) : !record.attendance?.checkOut ? (
              <>
                <Button
                  size="small"
                  icon={<CoffeeOutlined />}
                  style={{ color: '#9333ea', borderColor: '#9333ea' }}
                  onClick={() => handleMarkLeave(record)}
                  title={t('attendance.break')}
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
                <Tag color="success" icon={<CheckCircleOutlined />}>{t('attendance.doneTag')}</Tag>
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
        title={t('navigation.attendance')}
        description={role === 'ROLE_ADMIN' 
          ? t('attendance.subtitle')
          : t('attendance.subtitleManager')}
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
            className="bg-white dark:bg-gray-700 text-gray-700 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            {t('attendance.setDefaultTimes')}
          </Button>
        }
      />

      {/* Holiday Alert */}
      {isHoliday && (
        <Alert
          message={t('attendance.holidayAlertTitle')}
          description={
            <div>
              <div className="font-semibold text-lg">
                {holidayInfo?.name || t('attendance.publicHoliday')}
              </div>
              {holidayInfo?.description && (
                <div className="mt-1">{holidayInfo.description}</div>
              )}
              <div className="mt-2 text-sm">
                {t('attendance.holidayAlertDescription')}
              </div>
            </div>
          }
          type="info"
          showIcon
          icon={<CoffeeOutlined />}
          className="mb-4"
          closable
        />
      )}

      {/* Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={4}>
          <EnhancedCard>
            <Statistic
              title={t('employees.totalEmployees')}
              value={stats.total}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </EnhancedCard>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <EnhancedCard>
            <Statistic
              title={t('attendance.present')}
              value={stats.present}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </EnhancedCard>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <EnhancedCard>
            <Statistic
              title={t('attendance.absent')}
              value={stats.absent}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </EnhancedCard>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <EnhancedCard>
            <Statistic
              title={t('dashboard.attendance.lateArrivals')}
              value={stats.late}
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </EnhancedCard>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <EnhancedCard>
            <Statistic
              title={t('attendance.leave')}
              value={stats.onLeave}
              prefix={<SafetyOutlined style={{ color: '#ff7a45' }} />}
              valueStyle={{ color: '#ff7a45' }}
            />
          </EnhancedCard>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <EnhancedCard>
            <Statistic
              title={t('attendance.notMarked')}
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
          placeholder={t('attendance.selectDate')}
        />
        <Select
          placeholder={t('attendance.allDepartments')}
          style={{ width: 200 }}
          allowClear
          value={selectedDepartment}
          onChange={setSelectedDepartment}
        >
          {departmentsData?.filter((dept: any) => dept?.id !== undefined).map((dept: any) => (
            <Option key={dept.id} value={dept.id.toString()}>
              {dept.departmentName}
            </Option>
          ))}
        </Select>
        <Input
          placeholder={t('attendance.searchPlaceholder')}
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          style={{ width: 250 }}
        />
        <div className="ml-auto text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
          {t('attendance.defaultCheckInTime')}: {defaultCheckInTime} | {t('attendance.defaultCheckOutTime')}: {defaultCheckOutTime}
        </div>
      </FilterBar>

      {/* Bulk Actions Bar */}
      {selectedEmployeeIds.length > 0 && !isHoliday && (
        <EnhancedCard className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {t('attendance.selectedEmployees', { count: selectedEmployeeIds.length })}
              </span>
              <Button
                size="small"
                onClick={() => setSelectedEmployeeIds([])}
              >
                {t('attendance.clearSelection')}
              </Button>
            </div>
            <Space wrap>
              <Button
                type="primary"
                icon={<LoginOutlined />}
                onClick={() => setBulkCheckInModal(true)}
              >
                {t('attendance.bulkCheckIn')}
              </Button>
              <Button
                icon={<LogoutOutlined />}
                onClick={() => setBulkCheckOutModal(true)}
              >
                {t('attendance.bulkCheckOut')}
              </Button>
              <Button
                icon={<CoffeeOutlined />}
                onClick={() => setBulkBreakModal(true)}
              >
                {t('attendance.bulkBreak')}
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => setBulkAbsentModal(true)}
              >
                {t('attendance.bulkAbsent')}
              </Button>
            </Space>
          </div>
        </EnhancedCard>
      )}

      {/* Table */}
      <EnhancedCard>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 20,
            showTotal: (total) => t('attendance.totalEmployeesCount', { total }),
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
            <span>{t('attendance.markCheckIn')}</span>
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
            label={t('attendance.checkInTime')}
            rules={[{ required: true, message: t('attendance.pleaseSelectCheckInTime') }]}
          >
            <TimePicker format="HH:mm" className="w-full" />
          </Form.Item>
          <Form.Item name="location" label={t('attendance.location')}>
            <Input placeholder={t('attendance.locationPlaceholder')} />
          </Form.Item>
          <Form.Item name="notes" label={t('attendance.remarks')}>
            <Input.TextArea rows={3} placeholder={t('attendance.remarksPlaceholder')} />
          </Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setCheckInModal(false)}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit" icon={<LoginOutlined />}>
              {t('attendance.markCheckIn')}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Check-out Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <LogoutOutlined className="text-red-500" />
            <span>{t('attendance.markCheckOut')}</span>
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
            label={t('attendance.checkOutTime')}
            rules={[{ required: true, message: t('attendance.pleaseSelectCheckOutTime') }]}
          >
            <TimePicker format="HH:mm" className="w-full" />
          </Form.Item>
          <Form.Item name="notes" label={t('attendance.remarks')}>
            <Input.TextArea rows={3} placeholder={t('attendance.remarksPlaceholder')} />
          </Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setCheckOutModal(false)}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit" icon={<LogoutOutlined />}>
              {t('attendance.markCheckOut')}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Absent Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <CloseCircleOutlined className="text-red-500" />
            <span>{t('attendance.markAbsent')}</span>
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
            label={t('attendance.reason')}
            rules={[{ required: true, message: t('attendance.pleaseProvideReason') }]}
          >
            <Input.TextArea rows={3} placeholder={t('attendance.reasonForAbsence')} />
          </Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setAbsentModal(false)}>{t('common.cancel')}</Button>
            <Button type="primary" danger htmlType="submit" icon={<CloseCircleOutlined />}>
              {t('attendance.markAbsent')}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Default Times Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <SettingOutlined />
            <span>{t('attendance.setDefaultTimes')}</span>
          </div>
        }
        open={defaultTimesModal}
        onCancel={() => setDefaultTimesModal(false)}
        footer={null}
      >
        <Form form={defaultTimesForm} layout="vertical" onFinish={onDefaultTimesSubmit}>
          <Form.Item
            name="checkInTime"
            label={t('attendance.defaultCheckInTimeLabel')}
            rules={[{ required: true, message: t('attendance.pleaseSelectDefaultCheckIn') }]}
          >
            <TimePicker format="HH:mm" className="w-full" />
          </Form.Item>
          <Form.Item
            name="checkOutTime"
            label={t('attendance.defaultCheckOutTimeLabel')}
            rules={[{ required: true, message: t('attendance.pleaseSelectDefaultCheckOut') }]}
          >
            <TimePicker format="HH:mm" className="w-full" />
          </Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setDefaultTimesModal(false)}>{t('attendance.cancel')}</Button>
            <Button type="primary" htmlType="submit" icon={<SettingOutlined />}>
              {t('attendance.saveSettings')}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Details Modal */}
      <Modal
        title={t('attendance.attendanceDetails')}
        open={detailsModal}
        onCancel={() => setDetailsModal(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsModal(false)}>
            {t('attendance.close')}
          </Button>,
        ]}
        width={700}
      >
        {selectedEmployee && (
          <>
            <Descriptions column={2} bordered size="small" className="mb-4">
              <Descriptions.Item label={t('attendance.employeeLabel')}>
                {selectedEmployee.fullName}
              </Descriptions.Item>
              <Descriptions.Item label={t('attendance.employeeCodeLabel')}>
                {selectedEmployee.employeeCode}
              </Descriptions.Item>
              <Descriptions.Item label={t('attendance.departmentLabel')}>
                {selectedEmployee.department || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label={t('attendance.dateLabel')}>
                {dayjs(selectedDate).format('MMMM DD, YYYY')}
              </Descriptions.Item>
            </Descriptions>

            {selectedEmployee.attendance && (
              <>
                <Divider>{t('attendance.attendanceInformation')}</Divider>
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label={t('attendance.status')}>
                    <Tag color={
                      selectedEmployee.attendance.status === 'PRESENT' || selectedEmployee.attendance.status === 'present' ? 'success' :
                      selectedEmployee.attendance.status === 'ABSENT' || selectedEmployee.attendance.status === 'absent' ? 'error' : 'warning'
                    }>
                      {selectedEmployee.attendance.status}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label={t('attendance.workingHours')}>
                    {(() => {
                      const totalMinutes = selectedEmployee.attendance.workingHours || 0;
                      const hours = Math.floor(totalMinutes / 60);
                      const minutes = totalMinutes % 60;
                      return `${hours}${t('attendance.hrs')} ${minutes}${t('attendance.min')}`;
                    })()}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('attendance.checkIn')}>
                    {selectedEmployee.attendance.checkIn 
                      ? dayjs(selectedEmployee.attendance.checkIn).format('HH:mm:ss')
                      : t('attendance.notCheckedIn')}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('attendance.checkOut')}>
                    {selectedEmployee.attendance.checkOut 
                      ? dayjs(selectedEmployee.attendance.checkOut).format('HH:mm:ss')
                      : t('attendance.notCheckedOut')}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('attendance.late')}>
                    {selectedEmployee.attendance.isLate 
                      ? (() => {
                          const mins = selectedEmployee.attendance.lateMinutes;
                          const hours = Math.floor(mins / 60);
                          const minutes = mins % 60;
                          return hours > 0 ? `${t('attendance.yes')} (${hours}${t('attendance.hrs')} ${minutes}${t('attendance.min')})` : `${t('attendance.yes')} (${minutes} ${t('attendance.minutes')})`;
                        })()
                      : t('attendance.no')}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('attendance.earlyDeparture')}>
                    {selectedEmployee.attendance.isEarlyDeparture 
                      ? (() => {
                          const mins = selectedEmployee.attendance.earlyDepartureMinutes;
                          const hours = Math.floor(mins / 60);
                          const minutes = mins % 60;
                          return hours > 0 ? `${t('attendance.yes')} (${hours}${t('attendance.hrs')} ${minutes}${t('attendance.min')})` : `${t('attendance.yes')} (${minutes} ${t('attendance.minutes')})`;
                        })()
                      : t('attendance.no')}
                  </Descriptions.Item>
                  {selectedEmployee.attendance.breakDuration > 0 && (
                    <Descriptions.Item label={t('attendance.breakDuration')} span={2}>
                      {(() => {
                        const mins = selectedEmployee.attendance.breakDuration;
                        const hours = Math.floor(mins / 60);
                        const minutes = mins % 60;
                        return hours > 0 ? `${hours}${t('attendance.hrs')} ${minutes}${t('attendance.min')}` : `${minutes} ${t('attendance.minutes')}`;
                      })()}
                    </Descriptions.Item>
                  )}
                  {selectedEmployee.attendance.overtimeMinutes > 0 && (
                    <Descriptions.Item label={t('attendance.overtime')} span={2}>
                      {(() => {
                        const mins = selectedEmployee.attendance.overtimeMinutes;
                        const hours = Math.floor(mins / 60);
                        const minutes = mins % 60;
                        return hours > 0 ? `${hours}${t('attendance.hrs')} ${minutes}${t('attendance.min')}` : `${minutes} ${t('attendance.minutes')}`;
                      })()}
                    </Descriptions.Item>
                  )}
                  {selectedEmployee.attendance.location && (
                    <Descriptions.Item label={t('attendance.location')} span={2}>
                      {selectedEmployee.attendance.location}
                    </Descriptions.Item>
                  )}
                  {selectedEmployee.attendance.notes && (
                    <Descriptions.Item label={t('attendance.notes')} span={2}>
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
            <span>{t('attendance.addLatency')}</span>
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
            message={t('attendance.lateArrival')}
            description={t('attendance.lateArrivalDescription')}
            type="warning"
            showIcon
            className="mb-4"
          />
          <Form.Item
            name="lateMinutes"
            label={t('attendance.lateMinutes')}
            rules={[{ required: true, message: t('attendance.enterMinutes') }]}
          >
            <Input type="number" placeholder={t('attendance.minutesPlaceholder')} suffix={t('attendance.minutes')} />
          </Form.Item>
          <Form.Item name="reason" label={t('attendance.reason')}>
            <Input.TextArea rows={2} placeholder={t('attendance.reasonForLatency')} />
          </Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setLatencyModal(false)}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit" icon={<WarningOutlined />}>
              {t('attendance.addLatency')}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Early Departure Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <LogoutOutlined className="text-orange-500" />
            <span>{t('attendance.addEarlyDeparture')}</span>
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
            message={t('attendance.addEarlyDeparture')}
            description={t('attendance.earlyDepartureDescription')}
            type="warning"
            showIcon
            className="mb-4"
          />
          <Form.Item
            name="earlyMinutes"
            label={t('attendance.earlyDepartureMinutes')}
            rules={[{ required: true, message: t('attendance.enterMinutes') }]}
          >
            <Input type="number" placeholder={t('attendance.earlyDeparturePlaceholder')} suffix={t('attendance.minutes')} />
          </Form.Item>
          <Form.Item name="reason" label={t('attendance.reason')}>
            <Input.TextArea rows={2} placeholder={t('attendance.reasonForEarlyDeparture')} />
          </Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setEarlyDepartureModal(false)}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit" icon={<LogoutOutlined />}>
              {t('attendance.addEarlyDeparture')}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Leave/Break Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <CoffeeOutlined className="text-purple-500" />
            <span>{t('attendance.addBreakPeriod')}</span>
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
            message={t('attendance.breakTime')}
            description={t('attendance.breakDescription')}
            type="info"
            showIcon
            className="mb-4"
          />
          <Form.Item
            name="breakDuration"
            label={t('attendance.breakDuration')}
            rules={[{ required: true, message: t('attendance.selectBreakDuration') }]}
          >
            <Select placeholder={t('attendance.breakDurationPlaceholder')} size="large">
              <Option value="1">1 {t('attendance.hourShort')}</Option>
              <Option value="2">2 {t('attendance.hoursShort')}</Option>
              <Option value="3">3 {t('attendance.hoursShort')}</Option>
              <Option value="4">4 {t('attendance.hoursShort')}</Option>
              <Option value="5">5 {t('attendance.hoursShort')}</Option>
              <Option value="0.5">30 {t('attendance.minutesShort')}</Option>
              <Option value="0.25">15 {t('attendance.minutesShort')}</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="leaveType"
            label={t('attendance.breakType')}
            rules={[{ required: true, message: t('attendance.selectBreakType') }]}
          >
            <Select placeholder={t('attendance.breakTypePlaceholder')}>
              <Option value="LUNCH_BREAK">{t('attendance.lunchBreak')}</Option>
              <Option value="COFFEE_BREAK">{t('attendance.coffeeBreak')}</Option>
              <Option value="PRAYER_BREAK">{t('attendance.prayerBreak')}</Option>
              <Option value="REST_BREAK">{t('attendance.restBreak')}</Option>
              <Option value="DOCTOR_APPOINTMENT">{t('attendance.doctorAppointment')}</Option>
              <Option value="PERSONAL_MATTER">{t('attendance.personalMatter')}</Option>
              <Option value="BANK_VISIT">{t('attendance.bankVisit')}</Option>
              <Option value="OTHER">{t('attendance.other')}</Option>
            </Select>
          </Form.Item>
          <Form.Item name="reason" label={t('attendance.notesOptional')}>
            <Input.TextArea 
              rows={2} 
              placeholder={t('attendance.additionalNotesBreak')} 
            />
          </Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setLeaveModal(false)}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit" icon={<CoffeeOutlined />}>
              {t('attendance.addBreak')}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit Check-In Modal */}
      <Modal
        title={t('attendance.editCheckInTime')}
        open={editCheckInModal}
        onCancel={() => setEditCheckInModal(false)}
        footer={null}
      >
        <Form form={editCheckInForm} layout="vertical" onFinish={onEditCheckInSubmit}>
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="font-medium">{selectedEmployee?.fullName}</div>
            <div className="text-sm text-gray-500">{selectedEmployee?.employeeCode}</div>
          </div>
          <Alert
            message={t('attendance.backendValidation')}
            description={t('attendance.backendValidationCheckIn')}
            type="info"
            showIcon
            className="mb-4"
          />
          <Form.Item
            name="checkInTime"
            label={t('attendance.newCheckInTime')}
            rules={[{ required: true, message: t('attendance.pleaseSelectCheckInTime') }]}
          >
            <TimePicker format="HH:mm" className="w-full" showSecond={false} />
          </Form.Item>
          <Form.Item name="reason" label={t('attendance.reasonForEdit')}>
            <Input.TextArea rows={2} placeholder={t('attendance.reasonForEditCheckIn')} />
          </Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setEditCheckInModal(false)}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit">
              {t('attendance.updateCheckIn')}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit Check-Out Modal */}
      <Modal
        title={t('attendance.editCheckOutTime')}
        open={editCheckOutModal}
        onCancel={() => setEditCheckOutModal(false)}
        footer={null}
      >
        <Form form={editCheckOutForm} layout="vertical" onFinish={onEditCheckOutSubmit}>
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="font-medium">{selectedEmployee?.fullName}</div>
            <div className="text-sm text-gray-500">{selectedEmployee?.employeeCode}</div>
          </div>
          <Alert
            message={t('attendance.backendValidation')}
            description={t('attendance.backendValidationCheckOut')}
            type="info"
            showIcon
            className="mb-4"
          />
          <Form.Item
            name="checkOutTime"
            label={t('attendance.newCheckOutTime')}
            rules={[{ required: true, message: t('attendance.pleaseSelectCheckOutTime') }]}
          >
            <TimePicker format="HH:mm" className="w-full" showSecond={false} />
          </Form.Item>
          <Form.Item name="reason" label={t('attendance.reasonForEdit')}>
            <Input.TextArea rows={2} placeholder={t('attendance.reasonForEditCheckOut')} />
          </Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setEditCheckOutModal(false)}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit">
              {t('attendance.updateCheckOut')}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit Break Duration Modal */}
      <Modal
        title={t('attendance.editBreakDuration')}
        open={editBreakModal}
        onCancel={() => setEditBreakModal(false)}
        footer={null}
      >
        <Form form={editBreakForm} layout="vertical" onFinish={onEditBreakSubmit}>
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="font-medium">{selectedEmployee?.fullName}</div>
            <div className="text-sm text-gray-500">{selectedEmployee?.employeeCode}</div>
          </div>
          <Alert
            message={t('attendance.backendCalculation')}
            description={t('attendance.backendCalculationDescription')}
            type="info"
            showIcon
            className="mb-4"
          />
          <Form.Item
            name="breakDuration"
            label={t('attendance.breakDuration')}
            rules={[{ required: true, message: t('attendance.selectBreakDuration') }]}
          >
            <Select placeholder={t('attendance.breakDurationPlaceholder')} size="large">
              <Option value="0">{t('attendance.noBreak')}</Option>
              <Option value="0.25">15 {t('attendance.minutesShort')}</Option>
              <Option value="0.5">30 {t('attendance.minutesShort')}</Option>
              <Option value="1">1 {t('attendance.hourShort')}</Option>
              <Option value="1.5">1.5 {t('attendance.hoursShort')}</Option>
              <Option value="2">2 {t('attendance.hoursShort')}</Option>
              <Option value="3">3 {t('attendance.hoursShort')}</Option>
              <Option value="4">4 {t('attendance.hoursShort')}</Option>
              <Option value="5">5 {t('attendance.hoursShort')}</Option>
            </Select>
          </Form.Item>
          <Form.Item name="reason" label={t('attendance.notesOptional')}>
            <Input.TextArea rows={2} placeholder={t('attendance.reasonForEditing')} />
          </Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setEditBreakModal(false)}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit">
              {t('attendance.updateBreak')}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Add/Edit Overtime Modal */}
      <Modal
        title={t('attendance.addEditOvertime')}
        open={overtimeModal}
        onCancel={() => setOvertimeModal(false)}
        footer={null}
      >
        <Form form={overtimeForm} layout="vertical" onFinish={onOvertimeSubmit}>
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="font-medium">{selectedEmployee?.fullName}</div>
            <div className="text-sm text-gray-500">{selectedEmployee?.employeeCode}</div>
          </div>
          <Alert
            message={t('attendance.overtimeInfo')}
            description={t('attendance.overtimeDescription')}
            type="info"
            showIcon
            className="mb-4"
          />
          <Form.Item
            name="overtimeHours"
            label={t('attendance.overtimeHours')}
            rules={[
              { required: true, message: t('attendance.overtimeRequired') },
              { 
                validator: (_, value) => {
                  if (value && (isNaN(value) || parseFloat(value) < 0)) {
                    return Promise.reject(new Error(t('attendance.overtimeInvalid')));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input 
              type="number" 
              step="0.5" 
              min="0"
              placeholder={t('attendance.overtimePlaceholder')} 
              size="large"
              suffix={t('attendance.hours')}
            />
          </Form.Item>
          <Form.Item name="reason" label={t('attendance.notesOptional')}>
            <Input.TextArea rows={2} placeholder={t('attendance.reasonForOvertime')} />
          </Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setOvertimeModal(false)}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit">
              {t('attendance.saveOvertime')}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Bulk Check-In Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <LoginOutlined className="text-green-500" />
            <span>{t('attendance.bulkCheckIn')}</span>
          </div>
        }
        open={bulkCheckInModal}
        onCancel={() => setBulkCheckInModal(false)}
        footer={null}
        width={500}
      >
        <Form form={bulkCheckInForm} layout="vertical" onFinish={onBulkCheckInSubmit}>
          <Alert
            message={t('attendance.bulkActionWarning', { count: selectedEmployeeIds.length })}
            type="info"
            showIcon
            className="mb-4"
          />
          <Form.Item
            name="checkInTime"
            label={t('attendance.checkInTime')}
            rules={[{ required: true, message: t('attendance.pleaseSelectCheckInTime') }]}
          >
            <TimePicker format="HH:mm" className="w-full" size="large" />
          </Form.Item>
          <Form.Item name="location" label={t('attendance.location')}>
            <Input placeholder={t('attendance.locationPlaceholder')} />
          </Form.Item>
          <Form.Item name="notes" label={t('attendance.notes')}>
            <Input.TextArea rows={3} placeholder={t('attendance.remarksPlaceholder')} />
          </Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setBulkCheckInModal(false)}>{t('attendance.cancel')}</Button>
            <Button type="primary" htmlType="submit" icon={<LoginOutlined />}>
              {t('attendance.confirmCheckIn')}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Bulk Check-Out Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <LogoutOutlined className="text-red-500" />
            <span>{t('attendance.bulkCheckOut')}</span>
          </div>
        }
        open={bulkCheckOutModal}
        onCancel={() => setBulkCheckOutModal(false)}
        footer={null}
        width={500}
      >
        <Form form={bulkCheckOutForm} layout="vertical" onFinish={onBulkCheckOutSubmit}>
          <Alert
            message={t('attendance.bulkActionWarning', { count: selectedEmployeeIds.length })}
            type="info"
            showIcon
            className="mb-4"
          />
          <Form.Item
            name="checkOutTime"
            label={t('attendance.checkOutTime')}
            rules={[{ required: true, message: t('attendance.pleaseSelectCheckOutTime') }]}
          >
            <TimePicker format="HH:mm" className="w-full" size="large" />
          </Form.Item>
          <Form.Item name="notes" label={t('attendance.notes')}>
            <Input.TextArea rows={3} placeholder={t('attendance.remarksPlaceholder')} />
          </Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setBulkCheckOutModal(false)}>{t('attendance.cancel')}</Button>
            <Button type="primary" htmlType="submit" icon={<LogoutOutlined />}>
              {t('attendance.confirmCheckOut')}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Bulk Break Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <CoffeeOutlined className="text-purple-500" />
            <span>{t('attendance.bulkBreak')}</span>
          </div>
        }
        open={bulkBreakModal}
        onCancel={() => setBulkBreakModal(false)}
        footer={null}
        width={500}
      >
        <Form form={bulkBreakForm} layout="vertical" onFinish={onBulkBreakSubmit}>
          <Alert
            message={t('attendance.bulkActionWarning', { count: selectedEmployeeIds.length })}
            type="info"
            showIcon
            className="mb-4"
          />
          <Form.Item
            name="breakDuration"
            label={t('attendance.breakDuration')}
            rules={[{ required: true, message: t('attendance.selectBreakDuration') }]}
          >
            <Select placeholder={t('attendance.breakDurationPlaceholder')} size="large">
              <Option value="0.25">15 {t('attendance.minutes')}</Option>
              <Option value="0.5">30 {t('attendance.minutes')}</Option>
              <Option value="1">1 {t('attendance.hourShort')}</Option>
              <Option value="1.5">1.5 {t('attendance.hoursShort')}</Option>
              <Option value="2">2 {t('attendance.hoursShort')}</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="breakType"
            label={t('attendance.breakType')}
            rules={[{ required: true, message: t('attendance.selectBreakType') }]}
          >
            <Select placeholder={t('attendance.breakTypePlaceholder')}>
              <Option value="lunch">{t('attendance.lunchBreak')}</Option>
              <Option value="coffee">{t('attendance.coffeeBreak')}</Option>
              <Option value="prayer">{t('attendance.prayerBreak')}</Option>
              <Option value="rest">{t('attendance.restBreak')}</Option>
              <Option value="other">{t('attendance.other')}</Option>
            </Select>
          </Form.Item>
          <Form.Item name="reason" label={t('attendance.notesOptional')}>
            <Input.TextArea rows={2} placeholder={t('attendance.additionalNotesBreak')} />
          </Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setBulkBreakModal(false)}>{t('attendance.cancel')}</Button>
            <Button type="primary" htmlType="submit" icon={<CoffeeOutlined />}>
              {t('attendance.confirmBreakLeave')}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Bulk Absent Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <CloseCircleOutlined className="text-red-500" />
            <span>{t('attendance.bulkAbsent')}</span>
          </div>
        }
        open={bulkAbsentModal}
        onCancel={() => setBulkAbsentModal(false)}
        footer={null}
        width={500}
      >
        <Form form={bulkAbsentForm} layout="vertical" onFinish={onBulkAbsentSubmit}>
          <Alert
            message={t('attendance.bulkAbsentWarning', { count: selectedEmployeeIds.length })}
            type="warning"
            showIcon
            className="mb-4"
          />
          <Form.Item
            name="reason"
            label={t('attendance.reason')}
            rules={[{ required: true, message: t('attendance.pleaseProvideReason') }]}
          >
            <Input.TextArea rows={3} placeholder={t('attendance.reasonForAbsence')} />
          </Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setBulkAbsentModal(false)}>{t('attendance.cancel')}</Button>
            <Button type="primary" danger htmlType="submit" icon={<CloseCircleOutlined />}>
              {t('attendance.confirmAbsent')}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
