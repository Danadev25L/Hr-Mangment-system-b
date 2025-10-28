'use client';

import { useAuthGuard } from '@/src/middleware/auth';
import { Card, Table, Tag, Space, Button, Input, Modal, Form, Select, message, Popconfirm } from 'antd';
import { FileTextOutlined, UserOutlined, CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { api } from '@/src/lib/api';
import { useRouter } from 'next/navigation';

interface Application {
  id: number;
  userId: number;
  userName: string;
  employeeCode: string;
  departmentName: string;
  title: string;
  type: string;
  status: string;
  submissionDate: string;
  description: string;
}

export default function AdminApplicationsPage() {
  const { isAuthenticated, loading, user } = useAuthGuard('admin');
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [form] = Form.useForm();
  const router = useRouter();

  useEffect(() => {
    const fetchApplications = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoadingData(true);
        const response = await api.get('/api/admin/applications');
        setApplications(response.data || []);
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchApplications();
  }, [isAuthenticated]);

  useEffect(() => {
    const filtered = applications.filter(app =>
      (app.description || '').toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredApplications(filtered);
  }, [applications, searchText]);

  const handleUpdateStatus = async (appId: number, newStatus: string) => {
    try {
      await api.put(`/api/admin/applications/${appId}`, { status: newStatus });
      setApplications(prev => 
        prev.map(app => 
          app.id === appId ? { ...app, status: newStatus } : app
        )
      );
    } catch (error) {
      console.error('Error updating application:', error);
    }
  };

  const handleEdit = (record: Application) => {
    setEditingApplication(record);
    form.setFieldsValue({
      title: record.title,
      type: record.type,
      description: record.description,
    });
    setEditModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/admin/applications/${id}`);
      setApplications(prev => prev.filter(app => app.id !== id));
      message.success('Application deleted successfully');
    } catch (error) {
      console.error('Error deleting application:', error);
      message.error('Failed to delete application');
    }
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingApplication) {
        await api.put(`/api/admin/applications/${editingApplication.id}`, values);
        setApplications(prev => prev.map(app =>
          app.id === editingApplication.id ? { ...app, ...values } : app
        ));
        setEditModalVisible(false);
        message.success('Application updated successfully');
      }
    } catch (error) {
      console.error('Error updating application:', error);
      message.error('Failed to update application');
    }
  };

  const columns = [
    {
      title: 'Application',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Application) => (
        <div>
          <Space>
            <FileTextOutlined />
            <strong>{title} - {record.userName}</strong>
          </Space>
          <div style={{ marginTop: 4, color: '#666', fontSize: '12px' }}>
            {record.description || 'No description provided'}
          </div>
        </div>
      ),
    },
    {
      title: 'Employee',
      dataIndex: 'userName',
      key: 'userName',
      render: (name: string) => (
        <Space>
          <UserOutlined />
          {name}
        </Space>
      ),
    },
    {
      title: 'Employee Code',
      dataIndex: 'employeeCode',
      key: 'employeeCode',
    },
    {
      title: 'Department',
      dataIndex: 'departmentName',
      key: 'departmentName',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'approved' ? 'green' : status === 'rejected' ? 'red' : 'orange';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Submitted',
      dataIndex: 'submissionDate',
      key: 'submissionDate',
      render: (date: string) => (
        <Space>
          <CalendarOutlined />
          {new Date(date).toLocaleDateString()}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Application) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Button
                size="small"
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleUpdateStatus(record.id, 'approved')}
              >
                Approve
              </Button>
              <Button
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleUpdateStatus(record.id, 'rejected')}
              >
                Reject
              </Button>
            </>
          )}
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this application?"
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

  if (loading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Employee Applications</h1>
      
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search by description"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
      </Space>
      
      <Card>
        <Table
          columns={columns}
          dataSource={filteredApplications}
          loading={loadingData}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
          }}
        />
      </Card>

      <Modal
        title="Edit Application"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => setEditModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="leave_request">Leave Request</Select.Option>
              <Select.Option value="sick_leave">Sick Leave</Select.Option>
              <Select.Option value="vacation_leave">Vacation Leave</Select.Option>
              <Select.Option value="personal_leave">Personal Leave</Select.Option>
              <Select.Option value="maternity_leave">Maternity Leave</Select.Option>
              <Select.Option value="paternity_leave">Paternity Leave</Select.Option>
              <Select.Option value="emergency_leave">Emergency Leave</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}