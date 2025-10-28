"use client";

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Card, message } from 'antd';
import { UserAddOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { endpoints } from '@/src/lib/api';

const { Option } = Select;

interface AddEmployeeForm {
  username: string;
  password: string;
  fullName: string;
  role: string;
  departmentId: number;
}

interface Department {
  id: number;
  departmentName: string;
}

export default function ManagerAddEmployeePage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
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
        setDepartments(data || []);
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
      // Manager can only create employees, not admins or managers
      const employeeData = {
        ...values,
        role: 'ROLE_EMPLOYEE',
      };

      const response = await fetch(endpoints.admin.users, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData),
      });

      if (response.ok) {
        message.success('Employee added successfully!');
        form.resetFields();
        router.push('/manager/employees');
      } else {
        const error = await response.json();
        message.error(error.message || 'Failed to add employee');
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      message.error('Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  return (
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
          <div>
            <UserAddOutlined /> Add New Employee (Manager)
          </div>
        }
      >
        <div style={{ marginBottom: '16px', padding: '12px', background: '#f0f8ff', borderRadius: '4px' }}>
          <strong>Note:</strong> As a manager, you can only add employees to your department.
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[
              { required: true, message: 'Please enter username' },
              { min: 3, message: 'Username must be at least 3 characters' }
            ]}
          >
            <Input placeholder="Enter username" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: 'Please enter password' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>

          <Form.Item
            label="Full Name"
            name="fullName"
            rules={[{ required: true, message: 'Please enter full name' }]}
          >
            <Input placeholder="Enter full name" />
          </Form.Item>

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

          <Form.Item>
            <div>
              <Button type="primary" htmlType="submit" loading={loading}>
                Add Employee
              </Button>
              <Button onClick={() => form.resetFields()} style={{ marginLeft: 8 }}>
                Reset
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
