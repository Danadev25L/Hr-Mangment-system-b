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

const { Option } = Select;
const { TextArea } = Input;

interface Department {
  id: number;
  departmentName: string;
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
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form] = Form.useForm();

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/admin/departments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Backend returns array directly
        setDepartments(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/announcements', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAnnouncements(data.announcements || []);
      } else {
        message.error(data.message || 'Failed to fetch announcements');
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      message.error('An error occurred while fetching announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: AnnouncementFormValues) => {
    try {
      const response = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(values)
      });

      const data = await response.json();

      if (response.ok) {
        message.success('Announcement created successfully');
        setCreateModalVisible(false);
        form.resetFields();
        fetchAnnouncements();
      } else {
        message.error(data.message || 'Failed to create announcement');
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      message.error('An error occurred while creating announcement');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        message.success('Announcement deleted successfully');
        fetchAnnouncements();
      } else {
        message.error(data.message || 'Failed to delete announcement');
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      message.error('An error occurred while deleting announcement');
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
      const response = await fetch(`/api/admin/announcements/${selectedAnnouncement.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(values)
      });

      const data = await response.json();

      if (response.ok) {
        message.success('Announcement updated successfully');
        setEditModalVisible(false);
        setSelectedAnnouncement(null);
        fetchAnnouncements();
      } else {
        message.error(data.message || 'Failed to update announcement');
      }
    } catch (error) {
      console.error('Error updating announcement:', error);
      message.error('An error occurred while updating announcement');
    }
  };

  const toggleActiveStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/announcements/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      const data = await response.json();

      if (response.ok) {
        message.success(`Announcement ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        fetchAnnouncements();
      } else {
        message.error(data.message || 'Failed to toggle announcement status');
      }
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
    fetchAnnouncements();
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
              >
                <Select placeholder="All Departments" allowClear>
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
              >
                <Select placeholder="All Departments" allowClear>
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