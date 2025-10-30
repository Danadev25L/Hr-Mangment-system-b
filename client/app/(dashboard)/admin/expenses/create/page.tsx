"use client";

import { endpoints } from '@/src/lib/api';

import { PlusOutlined, ArrowLeftOutlined, DollarOutlined, TeamOutlined } from '@ant-design/icons';

import React, { useState, useEffect } from 'react';

import { 
  Form, 
  Input, 
  Button, 
  Card, 
  DatePicker,
  InputNumber,
  Row,
  Col,
  Space,
  App,
  Select
} from 'antd';

import { useRouter } from 'next/navigation';

import type { Dayjs } from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface Department {
  id: number;
  departmentName: string;
}

interface ExpenseFormValues {
  itemName: string;
  amount: number;
  date: Dayjs;
  reason?: string;
  departmentId?: number;
}

export default function CreateExpensePage() {
  const { message: messageApi } = App.useApp();
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
        setDepartments(Array.isArray(data) ? data : (data.departments || []));
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const onFinish = async (values: ExpenseFormValues) => {
    setLoading(true);
    try {
      const expenseData = {
        itemName: values.itemName,
        amount: values.amount,
        date: values.date.format('YYYY-MM-DD HH:mm:ss'),
        reason: values.reason || '',
        departmentId: values.departmentId // Admin can specify department
      };

      // Admin uses admin endpoint
      const response = await fetch('/api/admin/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(expenseData)
      });

      const data = await response.json();

      if (response.ok) {
        messageApi.success('Expense created successfully!');
        form.resetFields();
        router.push('/admin/expenses/track');
      } else {
        messageApi.error(data.message || 'Failed to create expense');
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      messageApi.error('An error occurred while creating the expense');
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
            <PlusOutlined />
            Create Expense
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
                label="Item Name"
                name="itemName"
                rules={[{ required: true, message: 'Please enter item name' }]}
              >
                <Input placeholder="Enter item name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Amount"
                name="amount"
                rules={[{ required: true, message: 'Please enter amount' }]}
              >
                <InputNumber
                  prefix={<DollarOutlined />}
                  placeholder="0.00"
                  min={0}
                  precision={2}
                  className="w-full"
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Date"
                name="date"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker 
                  className="w-full" 
                  showTime
                  format="YYYY-MM-DD HH:mm:ss"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Department"
                name="departmentId"
                rules={[{ required: true, message: 'Please select department or company-wide' }]}
                tooltip="Required: Select which department this expense is for, or choose Company-wide for organization-wide expenses"
              >
                <Select 
                  placeholder="Select department (Required)"
                  suffixIcon={<TeamOutlined />}
                >
                  <Option key="0" value={0}>
                    Company-wide (No specific department)
                  </Option>
                  {departments.map((dept) => (
                    <Option key={dept.id} value={dept.id}>
                      {dept.departmentName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Reason (Optional)"
                name="reason"
              >
                <TextArea 
                  rows={2} 
                  placeholder="Enter reason (optional)"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space size="middle">
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<PlusOutlined />}
                size="large"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create Expense
              </Button>
              <Button 
                onClick={() => router.push('/admin/expenses/track')}
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