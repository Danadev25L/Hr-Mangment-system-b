'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  DatePicker, 
  Space, 
  App, 
  Popconfirm, 
  Tag, 
  Statistic, 
  Row, 
  Col,
  Switch,
  Tooltip
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  CalendarOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { api } from '@/src/lib/api';
import dayjs, { Dayjs } from 'dayjs';

const { TextArea } = Input;

interface Holiday {
  id: number;
  date: string;
  name: string;
  description?: string;
  isRecurring: boolean;
}

interface HolidayFormValues {
  date: Dayjs;
  name: string;
  description?: string;
  isRecurring: boolean;
}

interface HolidayStatistics {
  summary: {
    totalHolidays: number;
    upcomingHolidays: number;
    pastHolidays: number;
    recurringHolidays: number;
  };
  generatedAt: string;
}

export default function AdminHolidaysPage() {
  const { message } = App.useApp();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [statistics, setStatistics] = useState<HolidayStatistics | null>(null);
  const [form] = Form.useForm<HolidayFormValues>();

  // Fetch holidays
  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/holidays');
      setHolidays(response.data.holidays || []);
    } catch {
      message.error('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await api.get('/api/admin/holidays/statistics');
      setStatistics(response.data.statistics);
    } catch {
      console.error('Failed to load statistics');
    }
  };

  useEffect(() => {
    fetchHolidays();
    fetchStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle create
  const handleCreate = () => {
    setEditingHoliday(null);
    form.resetFields();
    form.setFieldsValue({ 
      isRecurring: false
    });
    setIsModalVisible(true);
  };

  // Handle edit
  const handleEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    form.setFieldsValue({
      date: dayjs(holiday.date),
      name: holiday.name,
      description: holiday.description || '',
      isRecurring: holiday.isRecurring
    });
    setIsModalVisible(true);
  };

  // Handle submit
  const handleSubmit = async (values: HolidayFormValues) => {
    try {
      const holidayData = {
        date: values.date.format('YYYY-MM-DD'),
        name: values.name,
        description: values.description,
        isRecurring: values.isRecurring
      };

      if (editingHoliday) {
        await api.put(`/api/admin/holidays/${editingHoliday.id}`, holidayData);
        message.success('Holiday updated successfully');
      } else {
        await api.post('/api/admin/holidays', holidayData);
        message.success('Holiday created successfully');
      }

      setIsModalVisible(false);
      form.resetFields();
      fetchHolidays();
      fetchStatistics();
    } catch (error) {
      const errorMsg = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Operation failed'
        : 'Operation failed';
      message.error(errorMsg);
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/admin/holidays/${id}`);
      message.success('Holiday deleted successfully');
      fetchHolidays();
      fetchStatistics();
    } catch {
      message.error('Failed to delete holiday');
    }
  };

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
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Holiday) => (
        <Space>
          <Tooltip title="Edit Holiday">
            <Button 
              type="link" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
            >
              Edit
            </Button>
          </Tooltip>
          <Popconfirm
            title="Delete this holiday?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      {/* Statistics */}
      {statistics && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic 
                title="Total Holidays" 
                value={statistics.summary.totalHolidays}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic 
                title="Upcoming" 
                value={statistics.summary.upcomingHolidays}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic 
                title="Past Holidays" 
                value={statistics.summary.pastHolidays}
                valueStyle={{ color: '#999' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic 
                title="Recurring" 
                value={statistics.summary.recurringHolidays}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Main Table */}
      <Card 
        title={
          <Space>
            <CalendarOutlined />
            <span>Organization Holidays Management</span>
          </Space>
        }
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreate}
          >
            Add Holiday
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={holidays}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} holidays`,
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={
          <Space>
            <CalendarOutlined />
            {editingHoliday ? 'Edit Holiday' : 'Create New Holiday'}
          </Space>
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="date"
            label="Holiday Date"
            rules={[{ required: true, message: 'Please select the holiday date' }]}
          >
            <DatePicker 
              style={{ width: '100%' }} 
              format="MMMM DD, YYYY"
              placeholder="Select date"
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="Holiday Name"
            rules={[
              { required: true, message: 'Please enter the holiday name' },
              { max: 100, message: 'Name cannot exceed 100 characters' }
            ]}
          >
            <Input placeholder="e.g., New Year's Day" />
          </Form.Item>

          <Form.Item
            name="isRecurring"
            label="Recurring Holiday"
            valuePropName="checked"
            tooltip={
              <span>
                <InfoCircleOutlined /> Recurring holidays repeat every year
              </span>
            }
          >
            <Switch 
              checkedChildren="Recurring" 
              unCheckedChildren="One-Time"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description (Optional)"
          >
            <TextArea 
              rows={3} 
              placeholder="Add notes or details about this holiday..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingHoliday ? 'Update Holiday' : 'Create Holiday'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
