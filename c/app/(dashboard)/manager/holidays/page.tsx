'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, message, Row, Col, Statistic } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { api } from '@/src/lib/api';
import dayjs from 'dayjs';

interface Holiday {
  id: number;
  date: string;
  name: string;
  description?: string;
  isRecurring: boolean;
}

export default function ManagerHolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ totalHolidays: number; upcomingHolidays: number }>({ 
    totalHolidays: 0, 
    upcomingHolidays: 0 
  });

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/manager/holidays');
      setHolidays(response.data.holidays || []);
      
      // Calculate stats
      const total = response.data.holidays?.length || 0;
      const upcoming = response.data.holidays?.filter((h: Holiday) => 
        dayjs(h.date).isAfter(dayjs())
      ).length || 0;
      
      setStats({ totalHolidays: total, upcomingHolidays: upcoming });
    } catch {
      message.error('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('MMMM DD, YYYY'),
      sorter: (a: Holiday, b: Holiday) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: 'Holiday Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'isRecurring',
      key: 'isRecurring',
      render: (isRecurring: boolean) => (
        <Tag color={isRecurring ? 'purple' : 'default'}>
          {isRecurring ? 'Recurring' : 'One-Time'}
        </Tag>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc: string) => desc || <span className="text-gray-400">—</span>,
    },
  ];

  return (
    <div className="p-6">
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic 
              title="Total Holidays" 
              value={stats.totalHolidays}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic 
              title="Upcoming Holidays" 
              value={stats.upcomingHolidays}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Card 
        title={
          <Space>
            <CalendarOutlined />
            <span>Organization Holidays</span>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={holidays}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} holidays`,
          }}
        />
      </Card>
    </div>
  );
}
