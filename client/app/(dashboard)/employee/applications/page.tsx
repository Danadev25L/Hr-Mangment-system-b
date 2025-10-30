"use client";

import React, { useState, useEffect } from 'react';
import { Table, Button, Card, message, Tag, Space, Modal } from 'antd';
import { FileTextOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { endpoints } from '@/src/lib/api';

interface Application {
  id: number;
  title: string;
  type: string;
  description: string;
  status: string;
  priority?: string;
  createdAt: string;
  updatedAt: string;
}

export default function EmployeeApplicationTrackingPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailModal, setDetailModal] = useState({ visible: false, application: null as Application | null });
  const router = useRouter();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(endpoints.employee.applications, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data || []);
      } else {
        message.error('Failed to load applications');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      message.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusConfig = {
      pending: { color: 'orange', text: 'Pending' },
      approved: { color: 'green', text: 'Approved' },
      rejected: { color: 'red', text: 'Rejected' },
      in_review: { color: 'blue', text: 'In Review' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getPriorityTag = (priority?: string) => {
    if (!priority) return null;
    const priorityConfig = {
      low: { color: 'blue', text: 'Low' },
      medium: { color: 'orange', text: 'Medium' },
      high: { color: 'red', text: 'High' },
      urgent: { color: 'magenta', text: 'Urgent' },
    };
    const config = priorityConfig[priority as keyof typeof priorityConfig] || { color: 'default', text: priority };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getTypeDisplay = (type: string) => {
    const typeMapping = {
      leave: 'Leave Request',
      vacation: 'Vacation Request',
      sick_leave: 'Sick Leave',
      personal_leave: 'Personal Leave',
      promotion: 'Promotion Request',
      transfer: 'Transfer Request',
      training: 'Training Request',
      overtime: 'Overtime Request',
      flexible_hours: 'Flexible Hours',
      equipment: 'Equipment Request',
      other: 'Other',
    };
    return typeMapping[type as keyof typeof typeMapping] || type;
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => getTypeDisplay(type),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => getPriorityTag(priority),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Submitted',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Last Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text: unknown, record: Application) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setDetailModal({ visible: true, application: record })}
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="form-page-container">
      <Card 
        title={
          <div>
            <FileTextOutlined /> My Applications
          </div>
        }
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/employee/applications/send')}>
              New Application
            </Button>
            <Button onClick={fetchApplications}>
              Refresh
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={applications}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Application Details"
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, application: null })}
        footer={[
          <Button key="close" onClick={() => setDetailModal({ visible: false, application: null })}>
            Close
          </Button>,
        ]}
        width={600}
      >
        {detailModal.application && (
          <div>
            <p><strong>Title:</strong> {detailModal.application.title}</p>
            <p><strong>Type:</strong> {getTypeDisplay(detailModal.application.type)}</p>
            <p><strong>Status:</strong> {getStatusTag(detailModal.application.status)}</p>
            {detailModal.application.priority && (
              <p><strong>Priority:</strong> {getPriorityTag(detailModal.application.priority)}</p>
            )}
            <p><strong>Description:</strong></p>
            <div className="modal-description">
              {detailModal.application.description}
            </div>
            <p><strong>Submitted:</strong> {new Date(detailModal.application.createdAt).toLocaleString()}</p>
            <p><strong>Last Updated:</strong> {new Date(detailModal.application.updatedAt).toLocaleString()}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
