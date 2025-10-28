"use client";

import { useAuthGuard } from '@/src/middleware/auth';
import { api } from '@/src/lib/api';

import { SendOutlined, ArrowLeftOutlined } from '@ant-design/icons';

import React, { useState, useEffect } from 'react';

import { 
  Form, 
  Input, 
  Button, 
  Select, 
  Card, 
  Space, 
  DatePicker,
  Row,
  Col,
  message as antdMessage
} from 'antd';

import { useRouter } from 'next/navigation';

import type { Dayjs } from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface ApplicationFormValues {
  title: string;
  reason: string;
  dateRange: [Dayjs, Dayjs];
  applicationType: string;
  priority: string;
  departmentId?: number;
  userId?: number;
}

interface Department {
  id: number;
  departmentName: string;
}

interface User {
  id: number;
  username: string;
  fullName: string;
  employeeCode: string;
  role: string;
  departmentId: number;
}

export default function ApplicationSendingPage() {
  const { isAuthenticated, user } = useAuthGuard();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [messageApi, contextHolder] = antdMessage.useMessage();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>();

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchDepartments = async () => {
      try {
        const response = await api.get('/api/admin/departments');
        setDepartments(response.data || []);
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };

    fetchDepartments();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!selectedDepartment) {
      setEmployees([]);
      return;
    }

    const fetchEmployees = async () => {
      try {
        const response = await api.get(`/api/admin/users/department/${selectedDepartment}`);
        setEmployees(response.data || []);
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };

    fetchEmployees();
  }, [selectedDepartment]);

  const getAvailableDepartments = () => {
    if (!user) return [];
    if (user.role === 'admin') return departments;
    if (user.role === 'manager' && user.departmentId !== null && user.departmentId !== undefined) {
      return departments.filter(d => d.id === Number(user.departmentId));
    }
    return [];
  };

  const getAvailableEmployees = () => {
    if (!user) return [];
    if (user.role === 'admin') return employees.filter(e => e.id !== Number(user.id));
    if (user.role === 'manager') {
      // Manager can select himself and employees in his department
      const deptEmployees = employees;
      const manager: User = { 
        id: Number(user.id), 
        fullName: user.name, 
        username: user.email, 
        departmentId: Number(user.departmentId) || 0, 
        role: `ROLE_${user.role.toUpperCase()}` as string,
        employeeCode: ''
      };
      return [manager, ...deptEmployees.filter(e => e.id !== Number(user.id))];
    }
    return [];
  };

  const showDepartmentEmployeeSelection = user?.role === 'admin' || user?.role === 'manager';

  const onFinish = async (values: ApplicationFormValues) => {
    setLoading(true);
    try {
      const [startDate, endDate] = values.dateRange;
      
      const applicationData = {
        title: values.title,
        reason: values.reason,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        applicationType: values.applicationType,
        priority: values.priority,
        userId: values.userId || user?.id
      };

      const response = await fetch('/api/admin/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(applicationData)
      });

      const data = await response.json();

      if (response.ok) {
        messageApi.success('Application submitted successfully!');
        form.resetFields();
        router.push('/admin/applications');
      } else {
        messageApi.error(data.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      messageApi.error('An error occurred while submitting the application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <div className="form-page-container">
        <div className="form-page-header">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.back()}
          >
            Back
          </Button>
        </div>
        <Card 
          title={
            <Space>
              <SendOutlined />
              Submit New Application
            </Space>
          }
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
          >
            <Form.Item
              label="Application Title"
              name="title"
              rules={[{ required: true, message: 'Please enter application title' }]}
            >
              <Input placeholder="Enter application title" />
            </Form.Item>

            {showDepartmentEmployeeSelection && (
              <>
                <Form.Item
                  label="Department"
                  name="departmentId"
                  rules={[{ required: true, message: 'Please select department' }]}
                >
                  <Select placeholder="Select department" onChange={(value) => setSelectedDepartment(value)}>
                    {getAvailableDepartments().map(dept => (
                      <Option key={dept.id} value={dept.id}>{dept.departmentName}</Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Employee"
                  name="userId"
                  rules={[{ required: true, message: 'Please select employee' }]}
                >
                  <Select placeholder="Select employee">
                    {getAvailableEmployees().map(emp => (
                      <Option key={emp.id} value={emp.id}>
                        {emp.employeeCode ? `${emp.employeeCode} - ${emp.fullName}` : emp.fullName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </>
            )}

            <Form.Item
              label="Application Type"
              name="applicationType"
              rules={[{ required: true, message: 'Please select application type' }]}
            >
              <Select placeholder="Select application type">
                <Option value="leave_request">Leave Request</Option>
                <Option value="sick_leave">Sick Leave</Option>
                <Option value="vacation_leave">Vacation Leave</Option>
                <Option value="personal_leave">Personal Leave</Option>
                <Option value="maternity_leave">Maternity Leave</Option>
                <Option value="paternity_leave">Paternity Leave</Option>
                <Option value="emergency_leave">Emergency Leave</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="Priority"
              name="priority"
              rules={[{ required: true, message: 'Please select priority' }]}
            >
              <Select placeholder="Select priority">
                <Option value="low">Low</Option>
                <Option value="medium">Medium</Option>
                <Option value="high">High</Option>
                <Option value="urgent">Urgent</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="Date Range"
              name="dateRange"
              rules={[{ required: true, message: 'Please select date range' }]}
            >
              <RangePicker 
                className="w-full"
                placeholder={['Start Date', 'End Date']}
              />
            </Form.Item>
            <Form.Item
              label="Reason / Description"
              name="reason"
              rules={[{ required: true, message: 'Please enter reason' }]}
            >
              <TextArea 
                rows={4} 
                placeholder="Enter detailed reason for your application"
              />
            </Form.Item>
            <Form.Item className="form-button-group">
              <Row gutter={16}>
                <Col>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Submit Application
                  </Button>
                </Col>
                <Col>
                  <Button onClick={() => form.resetFields()}>
                    Reset Form
                  </Button>
                </Col>
                <Col>
                  <Button onClick={() => router.push('/admin/applications')}>
                    Cancel
                  </Button>
                </Col>
              </Row>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </>
  );
}

