'use client'

import { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Space, Modal, Form, Input, message } from 'antd'
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import apiClient from '@/lib/api'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'

const { TextArea } = Input

interface CorrectionRequest {
  id: number
  userId: number
  date: string
  requestType: string
  originalCheckIn: string | null
  originalCheckOut: string | null
  requestedCheckIn: string | null
  requestedCheckOut: string | null
  reason: string
  status: string
  createdAt: string
  user: {
    id: number
    fullName: string
    employeeCode: string
    jobTitle: string
  }
}

export default function ManagerCorrectionsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [corrections, setCorrections] = useState<CorrectionRequest[]>([])
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [selectedCorrection, setSelectedCorrection] = useState<CorrectionRequest | null>(null)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve')
  const [form] = Form.useForm()

  useEffect(() => {
    fetchPendingCorrections()
  }, [])

  const fetchPendingCorrections = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getPendingCorrections()
      setCorrections(response.corrections || [])
    } catch (error: any) {
      message.error('Failed to fetch correction requests')
    } finally {
      setLoading(false)
    }
  }

  const handleReview = (correction: CorrectionRequest, action: 'approve' | 'reject') => {
    setSelectedCorrection(correction)
    setReviewAction(action)
    setReviewModalVisible(true)
  }

  const handleSubmitReview = async (values: any) => {
    if (!selectedCorrection) return

    try {
      if (reviewAction === 'approve') {
        await apiClient.approveCorrection(selectedCorrection.id, values.reviewNotes)
        message.success('Correction request approved successfully!')
      } else {
        await apiClient.rejectCorrection(selectedCorrection.id, values.reviewNotes)
        message.success('Correction request rejected')
      }
      
      setReviewModalVisible(false)
      form.resetFields()
      fetchPendingCorrections()
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to process correction')
    }
  }

  const columns: ColumnsType<CorrectionRequest> = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.user.fullName}</div>
          <div className="text-gray-500 text-sm">{record.user.employeeCode}</div>
          <div className="text-gray-400 text-xs">{record.user.jobTitle}</div>
        </div>
      )
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('MMM DD, YYYY')
    },
    {
      title: 'Request Type',
      dataIndex: 'requestType',
      key: 'requestType',
      render: (type) => (
        <Tag color="blue">{type.replace(/_/g, ' ').toUpperCase()}</Tag>
      )
    },
    {
      title: 'Original Times',
      key: 'original',
      render: (_, record) => (
        <div className="text-sm">
          {record.originalCheckIn && (
            <div>In: {dayjs(record.originalCheckIn).format('hh:mm A')}</div>
          )}
          {record.originalCheckOut && (
            <div>Out: {dayjs(record.originalCheckOut).format('hh:mm A')}</div>
          )}
          {!record.originalCheckIn && !record.originalCheckOut && '-'}
        </div>
      )
    },
    {
      title: 'Requested Times',
      key: 'requested',
      render: (_, record) => (
        <div className="text-sm font-medium">
          {record.requestedCheckIn && (
            <div>In: {dayjs(record.requestedCheckIn).format('hh:mm A')}</div>
          )}
          {record.requestedCheckOut && (
            <div>Out: {dayjs(record.requestedCheckOut).format('hh:mm A')}</div>
          )}
        </div>
      )
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true
    },
    {
      title: 'Submitted',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('MMM DD, hh:mm A')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handleReview(record, 'approve')}
          >
            Approve
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseOutlined />}
            onClick={() => handleReview(record, 'reject')}
          >
            Reject
          </Button>
        </Space>
      )
    }
  ]

  return (
    <DashboardLayout role={user?.role || 'ROLE_MANAGER'}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">
          <ClockCircleOutlined /> Pending Correction Requests
        </h1>

      <Card>
        <Table
          columns={columns}
          dataSource={corrections}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} pending requests`
          }}
        />
      </Card>

      {/* Review Modal */}
      <Modal
        title={
          <Space>
            {reviewAction === 'approve' ? (
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            ) : (
              <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
            )}
            <span>{reviewAction === 'approve' ? 'Approve' : 'Reject'} Correction Request</span>
          </Space>
        }
        open={reviewModalVisible}
        onCancel={() => {
          setReviewModalVisible(false)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        okText={reviewAction === 'approve' ? 'Approve' : 'Reject'}
        okButtonProps={{ 
          danger: reviewAction === 'reject',
          type: reviewAction === 'approve' ? 'primary' : 'default'
        }}
      >
        {selectedCorrection && (
          <div className="mb-4">
            <p><strong>Employee:</strong> {selectedCorrection.user.fullName}</p>
            <p><strong>Date:</strong> {dayjs(selectedCorrection.date).format('MMMM DD, YYYY')}</p>
            <p><strong>Request Type:</strong> {selectedCorrection.requestType.replace(/_/g, ' ')}</p>
            <p><strong>Reason:</strong> {selectedCorrection.reason}</p>
            {selectedCorrection.requestedCheckIn && (
              <p><strong>Requested Check-in:</strong> {dayjs(selectedCorrection.requestedCheckIn).format('hh:mm A')}</p>
            )}
            {selectedCorrection.requestedCheckOut && (
              <p><strong>Requested Check-out:</strong> {dayjs(selectedCorrection.requestedCheckOut).format('hh:mm A')}</p>
            )}
          </div>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitReview}
        >
          <Form.Item
            name="reviewNotes"
            label="Review Notes"
            rules={
              reviewAction === 'reject' 
                ? [{ required: true, message: 'Please provide reason for rejection' }]
                : []
            }
          >
            <TextArea 
              rows={4} 
              placeholder={
                reviewAction === 'approve' 
                  ? 'Optional notes about the approval...' 
                  : 'Provide reason for rejection...'
              } 
            />
          </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}