"use client";

import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Card, 
  message, 
  Space, 
  Tag, 
  Popconfirm,
  Modal,
  Form,
  Input,
  Row,
  Col,
  Select
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

const { TextArea } = Input;

interface User {
  id: number;
  fullName: string;
  username: string;
  role: string;
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
  creator?: {
    fullName: string;
    username: string;
  };
  department?: {
    departmentName: string;
  };
}

interface AnnouncementFormValues {
  title: string;
  description: string;
  date: string;
  isActive: boolean;
  recipientUserIds?: number[];
}

export default function ManagerAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [departmentUsers, setDepartmentUsers] = useState<User[]>([]);
  const [form] = Form.useForm();

  const fetchDepartmentUsers = async () => {
    try {
      const response = await api.get('/api/manager/employees');
      setDepartmentUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching department users:', error);
    }
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/manager/announcements');
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
      await api.post('/api/manager/announcements', values);
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
      await api.delete(`/api/manager/announcements/${id}`);
      message.success('Announcement deleted successfully');
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      message.error('An error occurred while deleting announcement');
    }
  };

  const handleEdit = (record: Announcement) => {
    setSelectedAnnouncement(record);
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
      await api.put(`/api/manager/announcements/${selectedAnnouncement.id}`, values);
      message.success('Announcement updated successfully');
      setEditModalVisible(false);
      setSelectedAnnouncement(null);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error updating announcement:', error);
      message.error('An error occurred while updating announcement');
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
      dataIndex: 'department',
      key: 'department',
      render: (department) => department?.departmentName || 'N/A',
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
      title: 'Created By',
      dataIndex: 'creator',
      key: 'creator',
      render: (creator) => creator?.fullName || 'Unknown',
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
    fetchDepartmentUsers();
    fetchAnnouncements();
  }, []);

  return (
    <div className="p-6">
      <Card
        title={
          <Space>
            <BellOutlined />
            Department Announcements
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

          <Form.Item
            label="Date"
            name="date"
            rules={[{ required: true, message: 'Please select announcement date' }]}
          >
            <Input type="date" />
          </Form.Item>

          <Form.Item
            label="Recipients (Optional - Leave empty for all department members)"
            name="recipientUserIds"
          >
            <Select
              mode="multiple"
              placeholder="Select specific users or leave empty for all"
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={departmentUsers.map(user => ({
                label: `${user.fullName} (${user.role})`,
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

          <Form.Item
            label="Date"
            name="date"
            rules={[{ required: true, message: 'Please select announcement date' }]}
          >
            <Input type="date" />
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
                  {selectedAnnouncement.department?.departmentName || 'N/A'}
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
                <strong>Created By:</strong>
                <div className="mt-2">
                  {selectedAnnouncement.creator?.fullName || 'Unknown'}
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
