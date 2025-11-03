'use client'

import { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Space, message } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import apiClient from '@/lib/api'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'

interface CorrectionRequest {
  id: number
  date: string
  requestType: string
  originalCheckIn: string | null
  originalCheckOut: string | null
  requestedCheckIn: string | null
  requestedCheckOut: string | null
  reason: string
  status: string
  reviewNotes: string | null
  reviewedAt: string | null
  createdAt: string
}

export default function CorrectionRequestsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [corrections, setCorrections] = useState<CorrectionRequest[]>([])

  useEffect(() => {
    fetchCorrections()
  }, [])

  const fetchCorrections = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getMyCorrectionRequests()
      setCorrections(response.corrections || [])
    } catch (error: any) {
      message.error('Failed to fetch correction requests')
    } finally {
      setLoading(false)
    }
  }

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'approved':
        return <Tag color="success" icon={<CheckCircleOutlined />}>Approved</Tag>
      case 'rejected':
        return <Tag color="error" icon={<CloseCircleOutlined />}>Rejected</Tag>
      case 'pending':
        return <Tag color="warning" icon={<ClockCircleOutlined />}>Pending</Tag>
      default:
        return <Tag>{status}</Tag>
    }
  }

  const columns: ColumnsType<CorrectionRequest> = [
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
      render: (type) => type.replace(/_/g, ' ').toUpperCase()
    },
    {
      title: 'Requested Times',
      key: 'requested',
      render: (_, record) => (
        <div>
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Review Notes',
      dataIndex: 'reviewNotes',
      key: 'reviewNotes',
      ellipsis: true,
      render: (notes) => notes || '-'
    },
    {
      title: 'Submitted',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('MMM DD, YYYY hh:mm A')
    }
  ]

  return (
    <DashboardLayout role={user?.role || 'ROLE_EMPLOYEE'}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">
          <ClockCircleOutlined /> My Correction Requests
        </h1>

        <Card>
          <Table
            columns={columns}
            dataSource={corrections}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} requests`
            }}
          />
        </Card>
      </div>
    </DashboardLayout>
  )
}
