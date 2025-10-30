"use client";

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Select, App } from 'antd';
import { PlusOutlined, DollarOutlined, TeamOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { endpoints } from '@/src/lib/api';

const { Option } = Select;

interface Department {
  id: number;
  departmentName: string;
}

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

export default function AdminExpensesPage() {
  const { message: messageApi } = App.useApp();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);

  useEffect(() => {
    fetchDepartments();
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(endpoints.admin.departments, {
        headers: {
          'Authorization': `Bearer ${token}`,
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

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/expenses', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }

      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      messageApi.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = selectedDepartment === null 
    ? expenses 
    : selectedDepartment === 0
    ? expenses.filter(exp => !exp.departmentId)
    : expenses.filter(exp => exp.departmentId === selectedDepartment);

  const columns = [
    {
      title: 'Item',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string) => {
        const itemName = reason.split(' - ')[0];
        return <strong>{itemName}</strong>;
      },
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
    },
    {
      title: 'Department',
      dataIndex: 'departmentName',
      key: 'departmentName',
      render: (dept: string | null) => (
        <Tag color={dept ? 'blue' : 'default'} icon={<TeamOutlined />}>
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
      render: (date: string) => dayjs(date).format('MMM D, YYYY'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'approved' ? 'green' : status === 'pending' ? 'orange' : 'red';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
  ];

  return (
    <div className="p-6">
      <Card
        title={
          <Space>
            <DollarOutlined />
            Expense Management
          </Space>
        }
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => router.push('/admin/expenses/create')}
            size="large"
          >
            Create Expense
          </Button>
        }
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div className="flex items-center gap-4">
            <span className="font-medium">Filter by Department:</span>
            <Select
              style={{ width: 300 }}
              placeholder="All Departments"
              allowClear
              onChange={(value) => setSelectedDepartment(value === undefined ? null : value)}
              suffixIcon={<TeamOutlined />}
            >
              <Option value={null}>All Departments</Option>
              <Option value={0}>Company-wide (No Department)</Option>
              {departments.map((dept) => (
                <Option key={dept.id} value={dept.id}>
                  {dept.departmentName}
                </Option>
              ))}
            </Select>
          </div>

          <Table
            columns={columns}
            dataSource={filteredExpenses}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} expenses`,
            }}
          />
        </Space>
      </Card>
    </div>
  );
}
