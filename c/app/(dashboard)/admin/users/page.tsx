'use client';

import { useAuthGuard } from '@/src/middleware/auth';
import { api } from '@/src/lib/api';

import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, EyeOutlined } from '@ant-design/icons';

import { Card, Table, Button, Space, Tag, Modal, Form, Input, App } from 'antd';

import { useState, useEffect, useCallback } from 'react';

import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  employeeCode?: string;
  fullName: string;
  role: string;
  active: boolean;
  departmentId?: number;
  department?: {
    id: number;
    departmentName: string;
  };
  personalInformation?: {
    firstName: string;
    lastName: string;
    email: string;
    address?: string;
    city?: string;
    country?: string;
    dateOfBirth?: string;
    gender?: string;
    maritalStatus?: string;
  };
  jobTitle?: string;
  baseSalary?: number;
}

export default function AdminUsersPage() {
  const { isAuthenticated, loading } = useAuthGuard('admin');
  const { modal, message: messageApi } = App.useApp();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoadingData(true);
      const response = await api.get('/api/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      messageApi.error('Failed to load users');
    } finally {
      setLoadingData(false);
    }
  }, [messageApi]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated, fetchUsers]);

  // Handle create/edit user
  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      if (editingUser) {
        await api.put(`/api/admin/users/${editingUser.id}`, values);
        messageApi.success('User updated successfully');
      } else {
        await api.post('/api/admin/users', values);
        messageApi.success('User created successfully');
      }
      fetchUsers();
      setIsModalOpen(false);
      form.resetFields();
      setEditingUser(null);
    } catch (error: unknown) {
      console.error('Error saving user:', error);
      messageApi.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to save user');
    }
  };

  // Handle delete user
  const handleDelete = async (userId: number) => {
    modal.confirm({
      title: 'Delete User',
      content: 'Are you sure you want to delete this user?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await api.delete(`/api/admin/users/${userId}`);
          messageApi.success('User deleted successfully');
          fetchUsers();
        } catch (error: unknown) {
          messageApi.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to delete user');
        }
      },
    });
  };

  // Table columns
  const columns = [
    {
      title: 'Employee Code',
      dataIndex: 'employeeCode',
      key: 'employeeCode',
      render: (code: string) => (
        <Tag color="blue" className="font-mono">
          {code || 'N/A'}
        </Tag>
      ),
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      render: (text: string) => (
        <Space>
          <UserOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: 'Full Name',
      dataIndex: 'fullName',
      key: 'fullName',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const color = role === 'ROLE_ADMIN' ? 'red' : role === 'ROLE_MANAGER' ? 'blue' : 'green';
        return <Tag color={color}>{role.replace('ROLE_', '')}</Tag>;
      },
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (dept: { departmentName: string } | undefined) => 
        dept?.departmentName || 'No Department',
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: User) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/admin/users/${record.id}`)}
          >
            View
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/users/edit/${record.id}`)}
          >
            Edit
          </Button>
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage Users</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push('/admin/add-employee')}
          size="large"
        >
          Add Employee
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={users}
          loading={loadingData}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      {/* Add/Edit User Modal */}
      <Modal
        title={editingUser ? 'Edit User' : 'Add New User'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setEditingUser(null);
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: true, message: 'Please enter username' },
              { min: 3, message: 'Username must be at least 3 characters' },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="fullName"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter full name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select role' }]}
          >
            <select className="w-full p-2 border rounded" title="Select user role">
              <option value="">Select Role</option>
              <option value="ROLE_ADMIN">Admin</option>
              <option value="ROLE_MANAGER">Manager</option>
              <option value="ROLE_EMPLOYEE">Employee</option>
            </select>
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Please enter password' },
                { min: 6, message: 'Password must be at least 6 characters' },
              ]}
            >
              <Input.Password />
            </Form.Item>
          )}

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingUser ? 'Update' : 'Create'} User
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}