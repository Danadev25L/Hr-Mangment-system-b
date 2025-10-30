"use client";

import React, { useState, useEffect } from 'react';
import { Table, Button, Card, message, Tag, Space, Modal, Popconfirm, Form, Input, InputNumber, DatePicker, Select } from 'antd';
import { DollarOutlined, PlusOutlined, DeleteOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { endpoints } from '@/src/lib/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface Expense {
  id: number;
  title: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  status: string;
  employeeId?: number;
  employeeName?: string;
  employeeDepartment?: string;
  createdAt: string;
  reason?: string;
  userName?: string;
  userDepartment?: string;
}

export default function ExpenseTrackingPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailModal, setDetailModal] = useState({ visible: false, expense: null as Expense | null });
  const [editModal, setEditModal] = useState({ visible: false, expense: null as Expense | null });
  const [form] = Form.useForm();
  const router = useRouter();

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(endpoints.manager.expenses, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Handle both possible response formats
        const expensesData = data.expenses || data || [];
        
        // Map backend fields to frontend expected fields
        const mappedExpenses = expensesData.map((expense: Expense & { reason?: string; userName?: string; userDepartment?: string; fullName?: string; department?: string; expenseItemName?: string; }) => ({
          ...expense,
          title: expense.reason || expense.title || expense.expenseItemName || 'N/A',
          description: expense.reason || expense.description || '',
          employeeName: expense.userName || expense.employeeName || expense.fullName || 'Unknown',
          employeeDepartment: expense.userDepartment || expense.employeeDepartment || expense.department || 'Unknown Department'
        }));
        
        setExpenses(mappedExpenses);
      } else {
        message.error('Failed to load expenses');
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      message.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${endpoints.manager.expenses}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        message.success('Expense deleted successfully');
        fetchExpenses();
      } else {
        message.error('Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      message.error('Failed to delete expense');
    }
  };

  const handleEdit = (expense: Expense) => {
    form.setFieldsValue({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: dayjs(expense.date),
      description: expense.description
    });
    setEditModal({ visible: true, expense });
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem('token');
      
      const updateData = {
        ...values,
        date: values.date.format('YYYY-MM-DD')
      };

      const response = await fetch(`${endpoints.manager.expenses}/${editModal.expense?.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        message.success('Expense updated successfully');
        setEditModal({ visible: false, expense: null });
        form.resetFields();
        fetchExpenses();
      } else {
        message.error('Failed to update expense');
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      message.error('Failed to update expense');
    }
  };

  const getStatusTag = (status: string) => {
    const statusConfig = {
      pending: { color: 'orange', text: 'Pending' },
      approved: { color: 'green', text: 'Approved' },
      rejected: { color: 'red', text: 'Rejected' },
      paid: { color: 'blue', text: 'Paid' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getCategoryTag = (category: string) => {
    const categoryConfig = {
      office_supplies: { color: 'blue', text: 'Office Supplies' },
      travel: { color: 'green', text: 'Travel' },
      meals: { color: 'orange', text: 'Meals' },
      training: { color: 'purple', text: 'Training' },
      equipment: { color: 'cyan', text: 'Equipment' },
      utilities: { color: 'magenta', text: 'Utilities' },
      maintenance: { color: 'volcano', text: 'Maintenance' },
      other: { color: 'default', text: 'Other' },
    };
    const config = categoryConfig[category as keyof typeof categoryConfig] || { color: 'default', text: category };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => getCategoryTag(category || 'other'),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `$${amount.toFixed(2)}`,
    },
    {
      title: 'Department',
      dataIndex: 'employeeDepartment',
      key: 'employeeDepartment',
      render: (department: string) => (
        <Tag color="blue">{department || 'Your Department'}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text: unknown, record: Expense) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setDetailModal({ visible: true, expense: record })}
          >
            View
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this expense?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="form-page-container">
      <Card 
        title={
          <div>
            <DollarOutlined /> My Expenses
          </div>
        }
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/manager/expenses/create')}>
              Create Expense
            </Button>
            <Button onClick={fetchExpenses}>
              Refresh
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={expenses}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Expense Details"
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, expense: null })}
        footer={[
          <Button key="close" onClick={() => setDetailModal({ visible: false, expense: null })}>
            Close
          </Button>,
        ]}
        width={600}
      >
        {detailModal.expense && (
          <div>
            <p><strong>Title:</strong> {detailModal.expense.title}</p>
            <p><strong>Category:</strong> {getCategoryTag(detailModal.expense.category || 'other')}</p>
            <p><strong>Amount:</strong> ${detailModal.expense.amount.toFixed(2)}</p>
            <p><strong>Status:</strong> {getStatusTag(detailModal.expense.status)}</p>
            <p><strong>Department:</strong> <Tag color="blue">{detailModal.expense.employeeDepartment || 'Your Department'}</Tag></p>
            <p><strong>Date:</strong> {new Date(detailModal.expense.date).toLocaleDateString()}</p>
            <p><strong>Description:</strong></p>
            <div className="modal-description">
              {detailModal.expense.description}
            </div>
            <p><strong>Created:</strong> {new Date(detailModal.expense.createdAt).toLocaleString()}</p>
          </div>
        )}
      </Modal>

      <Modal
        title="Edit Expense"
        open={editModal.visible}
        onCancel={() => {
          setEditModal({ visible: false, expense: null });
          form.resetFields();
        }}
        onOk={handleUpdate}
        okText="Update"
        cancelText="Cancel"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, message: 'Please enter title' }]}
          >
            <Input placeholder="Enter title" />
          </Form.Item>

          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true, message: 'Please select category' }]}
          >
            <Select placeholder="Select category">
              <Option value="office_supplies">Office Supplies</Option>
              <Option value="travel">Travel</Option>
              <Option value="meals">Meals</Option>
              <Option value="training">Training</Option>
              <Option value="equipment">Equipment</Option>
              <Option value="utilities">Utilities</Option>
              <Option value="maintenance">Maintenance</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Amount"
            name="amount"
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <InputNumber
              prefix="$"
              placeholder="0.00"
              min={0}
              precision={2}
              className="w-full"
            />
          </Form.Item>

          <Form.Item
            label="Date"
            name="date"
            rules={[{ required: true, message: 'Please select date' }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
          >
            <TextArea rows={3} placeholder="Enter description" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
