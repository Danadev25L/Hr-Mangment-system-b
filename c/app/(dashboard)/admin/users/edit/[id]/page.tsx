"use client";

import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Select, 
  Card, 
  message, 
  Space, 
  DatePicker, 
  InputNumber, 
  Row, 
  Col, 
  Divider,
  Spin,
  App
} from 'antd';
import { 
  EditOutlined,
  ArrowLeftOutlined, 
  UserOutlined,
  ContactsOutlined,
  DollarOutlined,
  SafetyOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { endpoints } from '@/src/lib/api';
import dayjs from 'dayjs';

const { Option } = Select;

interface Department {
  id: number;
  departmentName: string;
}

interface EditEmployeeForm {
  username: string;
  password?: string;
  fullName: string;
  role: string;
  departmentId?: number;
  jobTitle?: string;
  baseSalary?: number;
  endDate?: string;
  firstName: string;
  lastName: string;
  email: string;
  address?: string;
  city?: string;
  country?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
}

export default function EditEmployeePage() {
  const { message: messageApi } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    fetchDepartments();
    fetchEmployeeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(endpoints.admin.departments, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDepartments(Array.isArray(data) ? data : (data.departments || []));
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchEmployeeData = async () => {
    try {
      setFetchLoading(true);
      const token = localStorage.getItem('token');
      
      const userResponse = await fetch(`/api/admin/users/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch employee data');
      }

      const userData = await userResponse.json();
      const employee = userData.data;
      
      form.setFieldsValue({
        username: employee.username,
        fullName: employee.fullName,
        role: employee.role,
        departmentId: employee.departmentId,
        jobTitle: employee.jobTitle,
        baseSalary: employee.baseSalary,
        endDate: employee.endDate ? dayjs(employee.endDate) : null,
        firstName: employee.personalInformation?.firstName || '',
        lastName: employee.personalInformation?.lastName || '',
        email: employee.personalInformation?.email || '',
        gender: employee.personalInformation?.gender || undefined,
        maritalStatus: employee.personalInformation?.maritalStatus || undefined,
        dateOfBirth: employee.personalInformation?.dateOfBirth ? dayjs(employee.personalInformation.dateOfBirth) : null,
        city: employee.personalInformation?.city || '',
        country: employee.personalInformation?.country || '',
        address: employee.personalInformation?.address || '',
      });
    } catch (error) {
      console.error('Error fetching employee:', error);
      messageApi.error('Failed to load employee details');
      router.push('/admin/users');
    } finally {
      setFetchLoading(false);
    }
  };

  const onFinish = async (values: EditEmployeeForm) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const userData: {
        username: string;
        fullName: string;
        role: string;
        departmentId?: number;
        jobTitle?: string;
        baseSalary: number;
        password?: string;
      } = {
        username: values.username,
        fullName: values.fullName,
        role: values.role,
        departmentId: values.departmentId,
        jobTitle: values.jobTitle,
        baseSalary: values.baseSalary || 0,
      };

      if (values.password && values.password.trim()) {
        userData.password = values.password;
      }

      const userResponse = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!userResponse.ok) {
        const error = await userResponse.json();
        throw new Error(error.message || 'Failed to update employee');
      }

      const personalData = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        gender: values.gender,
        maritalStatus: values.maritalStatus,
        dateOfBirth: values.dateOfBirth,
        city: values.city,
        country: values.country,
        address: values.address,
      };

      await fetch(`/api/admin/personal-info/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personalData),
      });

      message.success('Employee updated successfully!');
      router.push('/admin/users');
    } catch (error) {
      console.error('Error updating employee:', error);
      message.error(error instanceof Error ? error.message : 'Failed to update employee');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="mb-6">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => router.back()}
          className="rounded-lg"
        >
          Back
        </Button>
      </div>

      <Card 
        title={
          <Space>
            <EditOutlined />
            Edit Employee
          </Space>
        }
        className="rounded-lg border border-gray-200 shadow-sm"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Username"
                name="username"
                rules={[
                  { required: true, message: 'Please enter username' },
                  { min: 3, message: 'Username must be at least 3 characters' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />}
                  placeholder="Enter username" 
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="New Password (leave blank to keep current)"
                name="password"
              >
                <Input.Password 
                  prefix={<SafetyOutlined />}
                  placeholder="Enter new password (optional)" 
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">
            <Space>
              <ContactsOutlined />
              Personal Details
            </Space>
          </Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="First Name"
                name="firstName"
                rules={[{ required: true, message: 'Please enter first name' }]}
              >
                <Input placeholder="Enter first name" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Last Name"
                name="lastName"
                rules={[{ required: true, message: 'Please enter last name' }]}
              >
                <Input placeholder="Enter last name" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Full Name"
                name="fullName"
                rules={[{ required: true, message: 'Please enter full name' }]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Email Address"
                name="email"
                rules={[
                  { required: true, message: 'Please enter email address' },
                  { type: 'email', message: 'Please enter valid email address' }
                ]}
              >
                <Input placeholder="Enter email address" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Gender"
                name="gender"
              >
                <Select placeholder="Select gender">
                  <Option value="male">Male</Option>
                  <Option value="female">Female</Option>
                  <Option value="other">Other</Option>
                  <Option value="prefer_not_to_say">Prefer not to say</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Marital Status"
                name="maritalStatus"
              >
                <Select placeholder="Select status">
                  <Option value="single">Single</Option>
                  <Option value="married">Married</Option>
                  <Option value="divorced">Divorced</Option>
                  <Option value="widowed">Widowed</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Date of Birth"
                name="dateOfBirth"
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  placeholder="Select date of birth"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="City"
                name="city"
              >
                <Input placeholder="Enter city" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Country"
                name="country"
              >
                <Input placeholder="Enter country" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Address"
            name="address"
          >
            <Input.TextArea 
              rows={3}
              placeholder="Enter full address" 
            />
          </Form.Item>

          <Divider orientation="left">
            <Space>
              <TeamOutlined />
              Work Information
            </Space>
          </Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Role"
                name="role"
                rules={[{ required: true, message: 'Please select role' }]}
              >
                <Select placeholder="Select role">
                  <Option value="ROLE_ADMIN">Administrator</Option>
                  <Option value="ROLE_MANAGER">Manager</Option>
                  <Option value="ROLE_EMPLOYEE">Employee</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Department"
                name="departmentId"
                rules={[{ required: true, message: 'Please select department' }]}
              >
                <Select placeholder="Select department">
                  {departments.map((dept) => (
                    <Option key={dept.id} value={dept.id}>
                      {dept.departmentName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Job Title"
                name="jobTitle"
                rules={[{ required: true, message: 'Please enter job title' }]}
              >
                <Input placeholder="Enter job title" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">
            <Space>
              <DollarOutlined />
              Salary & Employment Duration
            </Space>
          </Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Base Salary (Monthly)"
                name="baseSalary"
                rules={[{ required: true, message: 'Please enter base salary' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  placeholder="Enter monthly salary"
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="End Date (Optional - Leave blank if still employed)"
                name="endDate"
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  placeholder="Select end date"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Form.Item>
            <Space size="middle">
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                size="large"
                icon={<EditOutlined />}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Update Employee
              </Button>
              <Button 
                onClick={() => router.back()}
                size="large"
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
