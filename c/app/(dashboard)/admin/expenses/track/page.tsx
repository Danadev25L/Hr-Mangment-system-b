"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, 
  Button, 
  Card, 
  message, 
  Space, 
  Tag, 
  Popconfirm,
  Modal,
  Row,
  Col,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined,
  EyeOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface Expense {
  id: number;
  userId: number;
  amount: number;
  reason: string;
  status: string;
  date: string;
  createdAt: string;
  userName: string;
  departmentId: number | null;
  departmentName: string | null;
}

interface ExpenseFormValues {
  reason: string;
  amount: number;
  date: dayjs.Dayjs;
  status: string;
}

export default function TrackExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [form] = Form.useForm();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(true);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/expenses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && isMounted) {
        // Data is already an array from the backend
        setExpenses(Array.isArray(data) ? data : []);
      } else if (isMounted) {
        message.error(data.message || 'Failed to fetch expenses');
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      if (isMounted) {
        message.error('An error occurred while fetching expenses');
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }, [isMounted]);

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/expenses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        message.success('Expense deleted successfully');
        fetchExpenses();
      } else {
        message.error(data.message || 'Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      message.error('An error occurred while deleting expense');
    }
  };

  const handleView = (record: Expense) => {
    setSelectedExpense(record);
    setViewModalVisible(true);
  };

  const handleEdit = (record: Expense) => {
    setSelectedExpense(record);
    form.setFieldsValue({
      reason: record.reason,
      amount: record.amount,
      date: dayjs(record.date),
      status: record.status
    });
    setEditModalVisible(true);
  };

  const handleUpdate = async (values: ExpenseFormValues) => {
    if (!selectedExpense) return;

    try {
      const updateData = {
        reason: values.reason,
        amount: values.amount,
        date: values.date.format('YYYY-MM-DD HH:mm:ss'),
        status: values.status
      };

      const response = await fetch(`/api/admin/expenses/${selectedExpense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (response.ok) {
        message.success('Expense updated successfully');
        setEditModalVisible(false);
        setSelectedExpense(null);
        form.resetFields();
        fetchExpenses();
      } else {
        message.error(data.message || 'Failed to update expense');
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      message.error('An error occurred while updating expense');
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      const response = await fetch(`/api/admin/expenses/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      if (response.ok) {
        message.success(`Expense ${status} successfully`);
        fetchExpenses();
      } else {
        message.error(data.message || `Failed to ${status} expense`);
      }
    } catch (error) {
      console.error('Error updating expense status:', error);
      message.error(`An error occurred while updating expense status`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'green';
      case 'pending':
        return 'orange';
      case 'paid':
        return 'blue';
      case 'rejected':
        return 'red';
      default:
        return 'default';
    }
  };

  const columns: ColumnsType<Expense> = [
    {
      title: 'Item',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string) => {
        const itemName = reason.split(' - ')[0];
        return <strong>{itemName}</strong>;
      },
      sorter: (a, b) => a.reason.localeCompare(b.reason),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <Tag color="green" className="text-base">
          ${amount.toLocaleString()}
        </Tag>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Department',
      dataIndex: 'departmentName',
      key: 'departmentName',
      render: (dept: string | null) => (
        <Tag color={dept ? 'blue' : 'default'}>
          {dept || 'Company-wide'}
        </Tag>
      ),
    },
    {
      title: 'User',
      dataIndex: 'userName',
      key: 'userName',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Approved', value: 'approved' },
        { text: 'Pending', value: 'pending' },
        { text: 'Paid', value: 'paid' },
        { text: 'Rejected', value: 'rejected' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
            title="View Details"
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Edit"
          />
          {record.status === 'pending' && (
            <>
              <Button
                type="text"
                icon={<CheckOutlined />}
                onClick={() => handleStatusUpdate(record.id, 'approved')}
                className="text-green-600"
                title="Approve"
              />
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={() => handleStatusUpdate(record.id, 'rejected')}
                className="text-red-600"
                title="Reject"
              />
            </>
          )}
          <Popconfirm
            title="Are you sure you want to delete this expense?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" icon={<DeleteOutlined />} danger title="Delete" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    setIsMounted(true);
    fetchExpenses();
    
    return () => {
      setIsMounted(false);
    };
  }, [fetchExpenses]);

  return (
    <div className="page-container">
      <Card
        title="Track Admin Expenses"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push('/admin/expenses/create')}
          >
            Create Expense
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={expenses}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} expenses`,
          }}
        />
      </Card>

      {/* Edit Modal */}
      <Modal
        title="Edit Expense"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setSelectedExpense(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Form.Item
            label="Description/Reason"
            name="reason"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea rows={3} placeholder="Enter expense description" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
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
            </Col>
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
          </Row>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select placeholder="Select status">
              <Option value="pending">Pending</Option>
              <Option value="approved">Approved</Option>
              <Option value="rejected">Rejected</Option>
              <Option value="paid">Paid</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Update Expense
              </Button>
              <Button onClick={() => {
                setEditModalVisible(false);
                setSelectedExpense(null);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Modal */}
      <Modal
        title="Expense Details"
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          setSelectedExpense(null);
        }}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        {selectedExpense && (
          <div className="expense-details">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <strong>Item:</strong>
                <div>{selectedExpense.reason.split(' - ')[0]}</div>
              </Col>
              <Col span={12}>
                <strong>Amount:</strong>
                <div>
                  <Tag color="green" className="text-base">
                    ${selectedExpense.amount.toLocaleString()}
                  </Tag>
                </div>
              </Col>
              <Col span={12}>
                <strong>Department:</strong>
                <div>
                  <Tag color={selectedExpense.departmentName ? 'blue' : 'default'}>
                    {selectedExpense.departmentName || 'Company-wide'}
                  </Tag>
                </div>
              </Col>
              <Col span={12}>
                <strong>User:</strong>
                <div>{selectedExpense.userName}</div>
              </Col>
              <Col span={12}>
                <strong>Date:</strong>
                <div>{dayjs(selectedExpense.date).format('MMMM DD, YYYY')}</div>
              </Col>
              <Col span={12}>
                <strong>Status:</strong>
                <div>
                  <Tag color={getStatusColor(selectedExpense.status)}>
                    {selectedExpense.status.toUpperCase()}
                  </Tag>
                </div>
              </Col>
              <Col span={24}>
                <strong>Description:</strong>
                <div>{selectedExpense.reason}</div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
}