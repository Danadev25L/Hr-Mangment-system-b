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
  Typography,
  Steps,
  Tabs
} from 'antd';
import { 
  UserAddOutlined, 
  ArrowLeftOutlined, 
  UserOutlined,
  InfoCircleOutlined,
  ContactsOutlined,
  DollarOutlined,
  SafetyOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { endpoints } from '@/src/lib/api';

const { Option } = Select;

interface Department {
  id: number;
  departmentName: string;
}

interface AddEmployeeForm {
  // Basic Info
  username: string;
  password: string;
  fullName: string;
  role: string;
  departmentId: number;
  jobTitle?: string;
  baseSalary?: number;
  
  // Personal Information
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

export default function AddEmployeePage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    fetchDepartments();
  }, []);

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
        // Backend returns array directly, not wrapped in object
        setDepartments(Array.isArray(data) ? data : (data.departments || []));
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      message.error('Failed to load departments');
    }
  };

  const onFinish = async (values: AddEmployeeForm) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Prepare user data
      const userData = {
        username: values.username,
        password: values.password,
        fullname: values.fullName, // Backend expects 'fullname' (lowercase)
        role: values.role,
        departmentId: values.departmentId,
        jobTitle: values.jobTitle,
        baseSalary: values.baseSalary || 0
      };

      // Prepare personal information data
      const personalData = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        address: values.address,
        city: values.city,
        country: values.country,
        dateOfBirth: values.dateOfBirth,
        gender: values.gender,
        maritalStatus: values.maritalStatus
      };

      // Create user first
      const userResponse = await fetch(endpoints.admin.users, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (userResponse.ok) {
        const createdUser = await userResponse.json();
        
        // If we have personal information, create that too
        if (values.firstName || values.lastName || values.email) {
          try {
            await fetch('/api/admin/personal-info', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...personalData,
                userId: createdUser.user?.id || createdUser.id
              }),
            });
          } catch (personalError) {
            console.warn('Failed to create personal information:', personalError);
            // Don't fail the entire process if personal info creation fails
          }
        }

        message.success('Employee created successfully with all details!');
        form.resetFields();
        router.push('/admin/users');
      } else {
        const error = await userResponse.json();
        message.error(error.message || 'Failed to create employee');
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      message.error('Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

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
            <UserAddOutlined />
            Add New Employee
          </Space>
        }
        className="rounded-lg border border-gray-200 shadow-sm"
      >
        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: '1',
              label: (
                <Space>
                  <UserOutlined />
                  Basic Information
                </Space>
              ),
              children: (
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
                        label="Password"
                        name="password"
                        rules={[
                          { required: true, message: 'Please enter password' },
                          { min: 6, message: 'Password must be at least 6 characters' }
                        ]}
                      >
                        <Input.Password 
                          prefix={<SafetyOutlined />}
                          placeholder="Enter password" 
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
                        <Select 
                          placeholder="Select role"
                          onChange={(value) => {
                            setSelectedRole(value);
                            // Clear department if admin is selected
                            if (value === 'ROLE_ADMIN') {
                              form.setFieldValue('departmentId', undefined);
                            }
                          }}
                        >
                          <Option value="ROLE_ADMIN">Administrator</Option>
                          <Option value="ROLE_MANAGER">Manager</Option>
                          <Option value="ROLE_EMPLOYEE">Employee</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    {selectedRole !== 'ROLE_ADMIN' && (
                      <Col span={8}>
                        <Form.Item
                          label="Department"
                          name="departmentId"
                          rules={[{ required: selectedRole !== 'ROLE_ADMIN', message: 'Please select department' }]}
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
                    )}
                    <Col span={selectedRole === 'ROLE_ADMIN' ? 16 : 8}>
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
                      Salary Information
                    </Space>
                  </Divider>

                  <Row gutter={16}>
                    <Col span={24}>
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
                  </Row>

                  <Divider />

                  <Form.Item>
                    <Space size="middle">
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={loading}
                        size="large"
                        icon={<UserAddOutlined />}
                      >
                        Create Employee
                      </Button>
                      <Button 
                        onClick={() => form.resetFields()}
                        size="large"
                      >
                        Reset Form
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
              ),
            },
            {
              key: '2',
              label: (
                <Space>
                  <InfoCircleOutlined />
                  Preview & Submit
                </Space>
              ),
              children: (
                <div className="py-5">
                  <Typography.Title level={4}>Employee Information Preview</Typography.Title>
                  <Typography.Text type="secondary">
                    Review the information before submitting. Switch back to the &quot;Basic Information&quot; tab to make any changes.
                  </Typography.Text>
                  
                  <Divider />
                  
                  <Row gutter={[16, 16]}>
                    <Col span={24}>
                      <Card size="small" title="Summary">
                        <Typography.Text>
                          Complete all required fields in the &quot;Basic Information&quot; tab, then return here to submit the form.
                        </Typography.Text>
                      </Card>
                    </Col>
                  </Row>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
