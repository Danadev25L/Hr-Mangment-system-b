'use client';

import { Card, Typography, Row, Col, Statistic, Button, Space, Table, Modal, Form, Input, message, Badge, Popconfirm } from 'antd';
import { 
  TeamOutlined, 
  ApartmentOutlined, 
  UserAddOutlined, 
  SettingOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  UsergroupAddOutlined
} from '@ant-design/icons';
import { useState, useEffect } from 'react';

const { Title, Text } = Typography;

interface Department {
  id: string;
  name: string;
  description: string;
  managerId: string;
  managerName: string;
  employeeCount: number;
  budget: number;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export default function AdminDashboard() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Mock admin stats
  const adminStats = {
    totalEmployees: 156,
    totalDepartments: 8,
    activeProjects: 23,
    pendingApprovals: 12
  };

  // Mock departments data
  useEffect(() => {
    const mockDepartments: Department[] = [
      {
        id: '1',
        name: 'Engineering',
        description: 'Software development and technical operations',
        managerId: 'mgr_001',
        managerName: 'John Smith',
        employeeCount: 45,
        budget: 250000,
        status: 'Active',
        createdAt: '2024-01-15'
      },
      {
        id: '2', 
        name: 'Human Resources',
        description: 'People management and organizational development',
        managerId: 'mgr_002',
        managerName: 'Sarah Johnson',
        employeeCount: 12,
        budget: 85000,
        status: 'Active',
        createdAt: '2024-01-20'
      },
      {
        id: '3',
        name: 'Marketing',
        description: 'Brand management and customer acquisition',
        managerId: 'mgr_003',
        managerName: 'Mike Wilson',
        employeeCount: 28,
        budget: 180000,
        status: 'Active',
        createdAt: '2024-02-01'
      },
      {
        id: '4',
        name: 'Finance',
        description: 'Financial planning and accounting operations', 
        managerId: 'mgr_004',
        managerName: 'Lisa Chen',
        employeeCount: 15,
        budget: 120000,
        status: 'Active',
        createdAt: '2024-02-10'
      }
    ];
    setDepartments(mockDepartments);
  }, []);

  const handleAddDepartment = () => {
    setEditingDepartment(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    form.setFieldsValue(department);
    setIsModalVisible(true);
  };

  const handleDeleteDepartment = (departmentId: string) => {
    setDepartments(prev => prev.filter(dept => dept.id !== departmentId));
    message.success('Department deleted successfully');
  };

  const handleModalOk = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      if (editingDepartment) {
        // Edit existing department
        setDepartments(prev => 
          prev.map(dept => 
            dept.id === editingDepartment.id 
              ? { ...dept, ...values }
              : dept
          )
        );
        message.success('Department updated successfully');
      } else {
        // Add new department
        const newDepartment: Department = {
          id: Date.now().toString(),
          ...values,
          employeeCount: 0,
          status: 'Active' as const,
          createdAt: new Date().toISOString().split('T')[0]
        };
        setDepartments(prev => [...prev, newDepartment]);
        message.success('Department created successfully');
      }
      
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Form validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingDepartment(null);
  };

  const departmentColumns = [
    {
      title: 'Department Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <ApartmentOutlined />
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Manager',
      dataIndex: 'managerName',
      key: 'managerName',
      render: (text: string) => (
        <Space>
          <UserAddOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: 'Employees',
      dataIndex: 'employeeCount',
      key: 'employeeCount',
      render: (count: number) => (
        <Badge count={count} style={{ backgroundColor: '#52c41a' }} />
      ),
    },
    {
      title: 'Budget',
      dataIndex: 'budget',
      key: 'budget',
      render: (budget: number) => `$${budget.toLocaleString()}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge 
          status={status === 'Active' ? 'success' : 'default'} 
          text={status}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Department) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            size="small"
          >
            View
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => handleEditDepartment(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this department?"
            description="This action cannot be undone."
            onConfirm={() => handleDeleteDepartment(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              type="link" 
              danger
              icon={<DeleteOutlined />} 
              size="small"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <Title level={2} className="mb-2">Admin Dashboard</Title>
        <Text type="secondary">Complete system administration and management</Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Employees"
              value={adminStats.totalEmployees}
              prefix={<TeamOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Departments"
              value={adminStats.totalDepartments}
              prefix={<ApartmentOutlined className="text-green-500" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Projects"
              value={adminStats.activeProjects}
              prefix={<SettingOutlined className="text-orange-500" />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Approvals"
              value={adminStats.pendingApprovals}
              prefix={<UsergroupAddOutlined className="text-purple-500" />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Admin Actions */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Quick Admin Actions">
            <Space direction="vertical" className="w-full" size="middle">
              <Button 
                type="primary" 
                icon={<UserAddOutlined />} 
                block
                className="h-12"
              >
                Add New Employee
              </Button>
              <Button 
                icon={<ApartmentOutlined />} 
                block
                className="h-12"
                onClick={handleAddDepartment}
              >
                Create Department
              </Button>
              <Button 
                icon={<SettingOutlined />} 
                block
                className="h-12"
              >
                System Settings
              </Button>
              <Button 
                icon={<TeamOutlined />} 
                block
                className="h-12"
              >
                Manage Roles
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="System Overview">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Title level={3} className="text-blue-600 mb-2">92%</Title>
                  <Text>System Performance</Text>
                </div>
              </Col>
              <Col span={12}>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Title level={3} className="text-green-600 mb-2">98.5%</Title>
                  <Text>Uptime This Month</Text>
                </div>
              </Col>
              <Col span={12}>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Title level={3} className="text-orange-600 mb-2">156</Title>
                  <Text>Active Users</Text>
                </div>
              </Col>
              <Col span={12}>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Title level={3} className="text-purple-600 mb-2">24/7</Title>
                  <Text>Support Available</Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Departments Management */}
      <Card 
        title={
          <Space>
            <ApartmentOutlined />
            Departments Management
          </Space>
        }
        extra={
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAddDepartment}
            >
              Add Department
            </Button>
            <Button>Export</Button>
          </Space>
        }
      >
        <Table
          columns={departmentColumns}
          dataSource={departments}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
          rowKey="id"
        />
      </Card>

      {/* Department Modal */}
      <Modal
        title={editingDepartment ? 'Edit Department' : 'Add New Department'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          className="mt-4"
        >
          <Form.Item
            label="Department Name"
            name="name"
            rules={[
              { required: true, message: 'Please enter department name' },
              { min: 3, message: 'Name must be at least 3 characters' }
            ]}
          >
            <Input placeholder="Enter department name" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[
              { required: true, message: 'Please enter department description' },
              { min: 10, message: 'Description must be at least 10 characters' }
            ]}
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Enter department description"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Manager Name"
                name="managerName"
                rules={[
                  { required: true, message: 'Please enter manager name' }
                ]}
              >
                <Input placeholder="Enter manager name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Budget"
                name="budget"
                rules={[
                  { required: true, message: 'Please enter budget' }
                ]}
              >
                <Input 
                  type="number" 
                  placeholder="Enter budget" 
                  prefix="$"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}