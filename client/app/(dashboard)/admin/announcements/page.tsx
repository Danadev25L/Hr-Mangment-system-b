"use client";

import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Card, 
  App, 
  Space, 
  Tag, 
  Popconfirm,
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  EyeOutlined,
  BellOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { api } from '@/src/lib/api';

const { Option } = Select;
const { TextArea } = Input;

interface Department {
  id: number;
  departmentName: string;
}

interface User {
  id: number;
  fullName: string;
  username: string;
  role: string;
  departmentId?: number;
}

interface Announcement {
  id: number;
  title: string;
  description: string;
  date: string;
  departmentId?: number;
  createdBy?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AnnouncementFormValues {
  title: string;
  description: string;
  date: string;
  departmentId?: number;
  isActive: boolean;
  recipientUserIds?: number[];
}

export default function AnnouncementsPage() {
  const { message } = App.useApp();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | undefined>();
  const [form] = Form.useForm();

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/api/admin/departments');
      setDepartments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/admin/users');
      const userList = Array.isArray(response.data) ? response.data : (response.data.users || []);
      // Filter only employees and managers
      const filtered = userList.filter((u: User) => 
        u.role === 'ROLE_EMPLOYEE' || u.role === 'ROLE_MANAGER'
      );
      setUsers(filtered);
      setFilteredUsers(filtered);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleDepartmentChange = (departmentId: number | undefined) => {
    setSelectedDepartmentId(departmentId);
    if (departmentId) {
      // Filter users by department
      const filtered = users.filter(u => u.departmentId === departmentId);
      setFilteredUsers(filtered);
    } else {
      // Show all users
      setFilteredUsers(users);
    }
    // Clear recipient selection when department changes
    form.setFieldsValue({ recipientUserIds: undefined });
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/announcements');
      setAnnouncements(response.data.announcements || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      message.error('An error occurred while fetching announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: AnnouncementFormValues) => {
    try {
      await api.post('/api/admin/announcements', values);
      message.success('Announcement created successfully');
      setCreateModalVisible(false);
      form.resetFields();
      fetchAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      message.error('An error occurred while creating announcement');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      // Ensure id is a number
      const numericId = Number(id);
      if (isNaN(numericId)) {
        message.error('Invalid announcement ID');
        return;
      }
      
      await api.delete(`/api/admin/announcements/${numericId}`);
      message.success('Announcement deleted successfully');
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      message.error('Failed to delete announcement');
    }
  };

  const handleEdit = (record: Announcement) => {
    setSelectedAnnouncement(record);
    // Format date for input type="date"
    const formattedDate = dayjs(record.date).format('YYYY-MM-DD');
    form.setFieldsValue({
      ...record,
      date: formattedDate
    });
    setEditModalVisible(true);
  };

  const handleView = (record: Announcement) => {
    setSelectedAnnouncement(record);
    setViewModalVisible(true);
  };

  const handleUpdate = async (values: AnnouncementFormValues) => {
    if (!selectedAnnouncement) return;

    try {
      const numericId = Number(selectedAnnouncement.id);
      if (isNaN(numericId)) {
        message.error('Invalid announcement ID');
        return;
      }
      
      await api.put(`/api/admin/announcements/${numericId}`, values);
      message.success('Announcement updated successfully');
      setEditModalVisible(false);
      setSelectedAnnouncement(null);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error updating announcement:', error);
      message.error('An error occurred while updating announcement');
    }
  };

  const toggleActiveStatus = async (id: number, currentStatus: boolean) => {
    try {
      const numericId = Number(id);
      if (isNaN(numericId)) {
        message.error('Invalid announcement ID');
        return;
      }
      
      await api.patch(`/api/admin/announcements/${numericId}/toggle`, { 
        isActive: !currentStatus 
      });
      message.success(`Announcement ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error toggling announcement:', error);
      message.error('An error occurred while toggling announcement status');
    }
  };

  const columns: ColumnsType<Announcement> = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      sorter: (a, b) => a.title.localeCompare(b.title),
      ellipsis: true,
    },
    {
      title: 'Department',
      dataIndex: 'departmentId',
      key: 'departmentId',
      render: (departmentId?: number) => {
        if (!departmentId) return <Tag>All Departments</Tag>;
        const dept = departments.find(d => d.id === departmentId);
        return dept ? dept.departmentName : 'Unknown';
      },
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
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'ACTIVE' : 'INACTIVE'}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="text"
            onClick={() => toggleActiveStatus(record.id, record.isActive)}
          >
            {record.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this announcement?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
    fetchAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6">
      <Card
        title={
          <Space>
            <BellOutlined />
            Admin Announcements
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            Create Announcement
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={announcements}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} announcements`,
          }}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        title="Create New Announcement"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{ isActive: true }}
        >
          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, message: 'Please enter announcement title' }]}
          >
            <Input placeholder="Enter announcement title" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter announcement description' }]}
          >
            <TextArea rows={4} placeholder="Enter announcement description" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Date"
                name="date"
                rules={[{ required: true, message: 'Please select announcement date' }]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Department"
                name="departmentId"
                tooltip="Select a specific department or leave as 'All Departments' for company-wide announcement"
              >
                <Select 
                  placeholder="Select department" 
                  allowClear
                  onChange={handleDepartmentChange}
                >
                  <Option value={undefined}>🌐 All Departments (Company-wide)</Option>
                  {departments.map(dept => (
                    <Option key={dept.id} value={dept.id}>{dept.departmentName}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Recipients (Optional - Leave empty to send to all)"
            name="recipientUserIds"
            tooltip="If department is selected, only users from that department are shown. Leave empty to send to all users in the selected department or company-wide."
          >
            <Select
              mode="multiple"
              placeholder={selectedDepartmentId ? "All users in selected department" : "All users company-wide"}
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={filteredUsers.map(user => ({
                label: `${user.fullName} - ${user.role.replace('ROLE_', '')}`,
                value: user.id
              }))}
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            valuePropName="checked"
          >
            <label>
              <input type="checkbox" aria-label="Set announcement as active" /> Active
            </label>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Create Announcement
              </Button>
              <Button onClick={() => setCreateModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Announcement"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setSelectedAnnouncement(null);
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
            label="Title"
            name="title"
            rules={[{ required: true, message: 'Please enter announcement title' }]}
          >
            <Input placeholder="Enter announcement title" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter announcement description' }]}
          >
            <TextArea rows={4} placeholder="Enter announcement description" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Date"
                name="date"
                rules={[{ required: true, message: 'Please select announcement date' }]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Department"
                name="departmentId"
                tooltip="Select a specific department or leave as 'All Departments' for company-wide announcement"
              >
                <Select placeholder="Select department" allowClear>
                  <Option value={undefined}>🌐 All Departments (Company-wide)</Option>
                  {departments.map(dept => (
                    <Option key={dept.id} value={dept.id}>{dept.departmentName}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="isActive"
            valuePropName="checked"
          >
            <label>
              <input type="checkbox" aria-label="Set announcement as active" /> Active
            </label>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Update Announcement
              </Button>
              <Button onClick={() => setEditModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Modal */}
      <Modal
        title="Announcement Details"
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          setSelectedAnnouncement(null);
        }}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {selectedAnnouncement && (
          <div className="announcement-details">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <strong>Title:</strong>
                <div className="mt-2">{selectedAnnouncement.title}</div>
              </Col>
              <Col span={24}>
                <strong>Description:</strong>
                <div className="mt-2 p-3 bg-gray-100 rounded whitespace-pre-wrap">
                  {selectedAnnouncement.description}
                </div>
              </Col>
              <Col span={12}>
                <strong>Date:</strong>
                <div className="mt-2">
                  {dayjs(selectedAnnouncement.date).format('MMMM DD, YYYY')}
                </div>
              </Col>
              <Col span={12}>
                <strong>Department:</strong>
                <div className="mt-2">
                  {selectedAnnouncement.departmentId 
                    ? departments.find(d => d.id === selectedAnnouncement.departmentId)?.departmentName || 'Unknown'
                    : 'All Departments'}
                </div>
              </Col>
              <Col span={12}>
                <strong>Status:</strong>
                <div className="mt-2">
                  <Tag color={selectedAnnouncement.isActive ? 'green' : 'red'}>
                    {selectedAnnouncement.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Tag>
                </div>
              </Col>
              <Col span={12}>
                <strong>Created:</strong>
                <div className="mt-2">
                  {dayjs(selectedAnnouncement.createdAt).format('MMMM DD, YYYY [at] HH:mm')}
                </div>
              </Col>
              {selectedAnnouncement.updatedAt !== selectedAnnouncement.createdAt && (
                <Col span={12}>
                  <strong>Last Updated:</strong>
                  <div className="mt-2">
                    {dayjs(selectedAnnouncement.updatedAt).format('MMMM DD, YYYY [at] HH:mm')}
                  </div>
                </Col>
              )}
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
}