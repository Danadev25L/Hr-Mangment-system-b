"use client";

import React, { useState } from 'react';
import { Form, Input, Button, Select, Card, message } from 'antd';
import { FileTextOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { endpoints } from '@/src/lib/api';

const { Option } = Select;
const { TextArea } = Input;

interface ApplicationForm {
  title: string;
  description: string;
  type: string;
  priority?: string;
}

export default function EmployeeApplicationSendPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: ApplicationForm) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(endpoints.employee.applications, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success('Application submitted successfully!');
        form.resetFields();
        router.push('/employee/applications');
      } else {
        const error = await response.json();
        message.error(error.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      message.error('Failed to submit application');
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
            <FileTextOutlined /> Submit New Application
          </div>
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

          <Form.Item
            label="Application Type"
            name="type"
            rules={[{ required: true, message: 'Please select application type' }]}
          >
            <Select placeholder="Select application type">
              <Option value="leave">Leave Request</Option>
              <Option value="vacation">Vacation Request</Option>
              <Option value="sick_leave">Sick Leave</Option>
              <Option value="personal_leave">Personal Leave</Option>
              <Option value="promotion">Promotion Request</Option>
              <Option value="transfer">Transfer Request</Option>
              <Option value="training">Training Request</Option>
              <Option value="overtime">Overtime Request</Option>
              <Option value="flexible_hours">Flexible Hours Request</Option>
              <Option value="equipment">Equipment Request</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Priority"
            name="priority"
          >
            <Select placeholder="Select priority (optional)">
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
              <Option value="urgent">Urgent</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea 
              rows={6} 
              placeholder="Please provide detailed information about your request, including dates if applicable"
            />
          </Form.Item>

          <Form.Item>
            <div>
              <Button type="primary" htmlType="submit" loading={loading}>
                Submit Application
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
