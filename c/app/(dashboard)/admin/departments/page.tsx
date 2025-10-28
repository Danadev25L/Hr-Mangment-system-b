'use client';

import { useAuthGuard } from '@/src/middleware/auth';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Statistic, Checkbox, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, BankOutlined, TeamOutlined } from '@ant-design/icons';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/src/lib/api';

interface Department {
  id: number;
  departmentName: string;
  isActive: boolean;
  employeeCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface DepartmentStats {
  totalDepartments: number;
  activeDepartments: number;
  totalEmployees: number;
}

export default function AdminDepartmentsPage() {
  const { isAuthenticated, loading } = useAuthGuard('admin');
  const { modal, message: messageApi } = App.useApp();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<DepartmentStats | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [form] = Form.useForm();

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    try {
      setLoadingData(true);
      
      // Fetch departments - this is the primary data
      const deptResponse = await api.get('/api/admin/departments');
      setDepartments(deptResponse.data || []);
      
      // Try to fetch statistics, but don't fail if it doesn't work
      try {
        const statsResponse = await api.get('/api/admin/departments/statistics');
        setStats(statsResponse.data);
      } catch (error) {
        console.warn('Could not fetch department statistics:', error);
        // Calculate basic stats from departments data
        const basicStats = {
          totalDepartments: deptResponse.data?.length || 0,
          activeDepartments: deptResponse.data?.filter((d: Department) => d.isActive)?.length || 0,
          totalEmployees: deptResponse.data?.reduce((sum: number, d: Department) => sum + (d.employeeCount || 0), 0) || 0
        };
        setStats(basicStats);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      messageApi.error('Failed to load departments');
    } finally {
      setLoadingData(false);
    }
  }, [messageApi]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDepartments();
    }
  }, [isAuthenticated, fetchDepartments]);

  // Handle create/edit department
  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      console.log('Submitting department data:', values);
      
      const departmentData = {
        departmentName: values.departmentName,
        isActive: values.isActive !== false // Default to true if not specified
      };

      console.log('Prepared department data:', departmentData);

      if (editingDepartment) {
        console.log('Updating department with ID:', editingDepartment.id);
        const response = await api.put(`/api/admin/departments/${editingDepartment.id}`, departmentData);
        console.log('Update response:', response);
        messageApi.success('Department updated successfully');
      } else {
        console.log('Creating new department');
        const response = await api.post('/api/admin/departments', departmentData);
        console.log('Create response:', response);
        messageApi.success('Department created successfully');
      }
      
      fetchDepartments();
      setIsModalOpen(false);
      form.resetFields();
      setEditingDepartment(null);
    } catch (error: unknown) {
      console.error('Error saving department:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to save department';
      messageApi.error(errorMessage);
    }
  };

  // Handle delete department
  const handleDelete = async (departmentId: number) => {
    const department = departments.find(d => d.id === departmentId);
    const employeeCount = department?.employeeCount || 0;
    
    modal.confirm({
      title: 'Delete Department',
      content: employeeCount > 0 
        ? `This department has ${employeeCount} employee(s). Are you sure you want to delete it? This will affect the employees.`
        : 'Are you sure you want to delete this department?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          console.log('Deleting department with ID:', departmentId);
          const response = await api.delete(`/api/admin/departments/${departmentId}`);
          console.log('Delete response:', response);
          messageApi.success('Department deleted successfully');
          fetchDepartments();
        } catch (error: unknown) {
          console.error('Error deleting department:', error);
          const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to delete department';
          messageApi.error(errorMessage);
        }
      },
    });
  };

  // Table columns
  const columns = [
    {
      title: 'Department Name',
      dataIndex: 'departmentName',
      key: 'departmentName',
      render: (text: string) => (
        <Space>
          <BankOutlined />
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: 'Employee Count',
      dataIndex: 'employeeCount',
      key: 'employeeCount',
      render: (count: number) => (
        <Space>
          <TeamOutlined />
          <span>{count || 0} employees</span>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Department) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingDepartment(record);
              form.setFieldsValue({
                departmentName: record.departmentName,
                isActive: record.isActive !== false // Ensure it's boolean
              });
              setIsModalOpen(true);
            }}
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
    return <div className="flex justify-center items-center h-96">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Departments Management</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingDepartment(null);
            form.resetFields();
            setIsModalOpen(true);
          }}
        >
          Add Department
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <Statistic
              title="Total Departments"
              value={stats.totalDepartments}
              prefix={<BankOutlined />}
            />
          </Card>
          <Card>
            <Statistic
              title="Active Departments"
              value={stats.activeDepartments}
              prefix={<BankOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
          <Card>
            <Statistic
              title="Total Employees"
              value={stats.totalEmployees}
              prefix={<TeamOutlined />}
            />
          </Card>
        </div>
      )}

      {/* Departments Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={departments}
          loading={loadingData}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      {/* Add/Edit Department Modal */}
      <Modal
        title={editingDepartment ? 'Edit Department' : 'Add New Department'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setEditingDepartment(null);
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ isActive: true }}
        >
          <Form.Item
            name="departmentName"
            label="Department Name"
            rules={[
              { required: true, message: 'Please enter department name' },
              { min: 2, message: 'Department name must be at least 2 characters' },
            ]}
          >
            <Input placeholder="Enter department name" />
          </Form.Item>

          <Form.Item
            name="isActive"
            valuePropName="checked"
            label="Department Status"
          >
            <Checkbox defaultChecked={true}>
              Active Department
            </Checkbox>
          </Form.Item>

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingDepartment ? 'Update' : 'Create'} Department
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}