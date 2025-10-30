"use client";

import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Select, 
  Card, 
  message, 
  DatePicker,
  InputNumber,
  Row,
  Col,
  Space
} from 'antd';
import { PlusOutlined, ArrowLeftOutlined, DollarOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { Dayjs } from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface ExpenseFormValues {
  itemName: string;
  amount: number;
  date: Dayjs;
  description?: string;
  category: string;
  status?: string;
  purchasedFrom?: string;
}

export default function CreateExpensePage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: ExpenseFormValues) => {
    setLoading(true);
    try {
      // Map frontend fields to backend expected fields
      const expenseData = {
        itemName: values.itemName,
        amount: values.amount,
        date: values.date.format('YYYY-MM-DD'),
        reason: values.description || values.itemName,
        purchasedFrom: values.purchasedFrom || ''
        // No departmentId - manager's department is automatically used
        // No status - will be 'pending' by default, needs admin approval
      };

      const response = await fetch('/api/manager/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(expenseData)
      });

      const data = await response.json();

      if (response.ok) {
        message.success('Expense created successfully and pending admin approval!');
        form.resetFields();
        router.push('/manager/expenses');
      } else {
        message.error(data.message || 'Failed to create expense');
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      message.error('An error occurred while creating the expense');
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
          <Space>
            <PlusOutlined />
            Create New Expense
          </Space>
        }
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
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Purchase Date"
                name="date"
                rules={[{ required: true, message: 'Please select purchase date' }]}
              >
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Purchased From (Store/Vendor)"
                name="purchasedFrom"
              >
                <Input placeholder="Enter store or vendor name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Category"
                name="category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select placeholder="Select category">
                  <Option value="travel">Travel</Option>
                  <Option value="meals">Meals & Entertainment</Option>
                  <Option value="office_supplies">Office Supplies</Option>
                  <Option value="training">Training & Development</Option>
                  <Option value="telecommunications">Telecommunications</Option>
                  <Option value="software">Software & Subscriptions</Option>
                  <Option value="equipment">Equipment</Option>
                  <Option value="marketing">Marketing</Option>
                  <Option value="utilities">Utilities</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <div className="text-sm text-gray-600 mt-8">
                <strong>Note:</strong> Expense will be submitted to your department and requires admin approval.
              </div>
            </Col>
          </Row>

          <Form.Item
            label="Description (Optional)"
            name="description"
          >
            <TextArea 
              rows={3} 
              placeholder="Enter expense description"
            />
          </Form.Item>

          <Form.Item className="form-button-group">
            <Row gutter={16}>
              <Col>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Create Expense
                </Button>
              </Col>
              <Col>
                <Button onClick={() => form.resetFields()}>
                  Reset Form
                </Button>
              </Col>
              <Col>
                <Button onClick={() => router.push('/manager/expenses')}>
                  Cancel
                </Button>
              </Col>
            </Row>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
