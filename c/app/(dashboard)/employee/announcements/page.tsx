"use client";

import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Card, 
  message, 
  Space, 
  Tag, 
  Modal,
  Row,
  Col,
  Badge
} from 'antd';
import { 
  EyeOutlined,
  BellOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { api } from '@/src/lib/api';

interface Announcement {
  id: number;
  title: string;
  description: string;
  date: string;
  departmentId?: number;
  createdBy?: number;
  isActive: boolean;
  createdAt: string;
  isRead: boolean;
  readAt?: string;
  creator?: {
    fullName: string;
    username: string;
  };
  department?: {
    departmentName: string;
  };
}

export default function EmployeeAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/employee/announcements');
      setAnnouncements(response.data.announcements || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      message.error('An error occurred while fetching announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (record: Announcement) => {
    setSelectedAnnouncement(record);
    setViewModalVisible(true);

    // Mark as read if not already read
    if (!record.isRead) {
      try {
        await api.patch(`/api/employee/announcements/${record.id}/read`);
        // Update the local state
        setAnnouncements(prev => 
          prev.map(a => 
            a.id === record.id 
              ? { ...a, isRead: true, readAt: new Date().toISOString() }
              : a
          )
        );
      } catch (error) {
        console.error('Error marking announcement as read:', error);
      }
    }
  };

  const unreadCount = announcements.filter(a => !a.isRead).length;

  const columns: ColumnsType<Announcement> = [
    {
      title: 'Status',
      dataIndex: 'isRead',
      key: 'isRead',
      width: 80,
      render: (isRead: boolean) => (
        <Badge 
          status={isRead ? 'default' : 'processing'} 
          text={isRead ? 'Read' : 'New'}
        />
      ),
      filters: [
        { text: 'Unread', value: false },
        { text: 'Read', value: true },
      ],
      onFilter: (value, record) => record.isRead === value,
      defaultFilteredValue: ['false'],
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      sorter: (a, b) => a.title.localeCompare(b.title),
      ellipsis: true,
      render: (text: string, record: Announcement) => (
        <span className={!record.isRead ? 'font-bold' : 'font-normal'}>
          {text}
        </span>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (department) => (
        <Tag>{department?.departmentName || 'Company-wide'}</Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'From',
      dataIndex: 'creator',
      key: 'creator',
      render: (creator) => creator?.fullName || 'Unknown',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return (
    <div className="p-6">
      <Card
        title={
          <Space>
            <BellOutlined />
            My Announcements
            {unreadCount > 0 && (
              <Badge count={unreadCount} />
            )}
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={announcements}
          loading={loading}
          rowKey="id"
          rowClassName={(record) => !record.isRead ? 'bg-blue-50' : ''}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} announcements`,
          }}
        />
      </Card>

      {/* View Modal */}
      <Modal
        title={
          <Space>
            <BellOutlined />
            Announcement Details
            {selectedAnnouncement?.isRead && (
              <Tag icon={<CheckCircleOutlined />} color="success">
                Read
              </Tag>
            )}
          </Space>
        }
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          setSelectedAnnouncement(null);
        }}
        footer={[
          <Button key="close" type="primary" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedAnnouncement && (
          <div className="announcement-details">
            <Row gutter={[16, 24]}>
              <Col span={24}>
                <div className="text-2xl font-bold mb-4">
                  {selectedAnnouncement.title}
                </div>
              </Col>
              <Col span={24}>
                <strong>Message:</strong>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-base leading-relaxed">
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
                  <Tag>{selectedAnnouncement.department?.departmentName || 'Company-wide'}</Tag>
                </div>
              </Col>
              <Col span={12}>
                <strong>From:</strong>
                <div className="mt-2">
                  {selectedAnnouncement.creator?.fullName || 'Unknown'}
                </div>
              </Col>
              <Col span={12}>
                <strong>Posted:</strong>
                <div className="mt-2">
                  {dayjs(selectedAnnouncement.createdAt).format('MMMM DD, YYYY [at] HH:mm')}
                </div>
              </Col>
              {selectedAnnouncement.readAt && (
                <Col span={12}>
                  <strong>Read At:</strong>
                  <div className="mt-2">
                    {dayjs(selectedAnnouncement.readAt).format('MMMM DD, YYYY [at] HH:mm')}
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
