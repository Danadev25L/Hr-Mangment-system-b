'use client'

import { useState, useEffect } from 'react'
import { Card, Table, Tag, Select, message } from 'antd'
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined
} from '@ant-design/icons'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import apiClient from '@/lib/api'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'

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
  reviewNotes: string | null
  createdAt: string
  user: {
    id: number
    fullName: string
    employeeCode: string
    department: string
  }
}

export default function AdminCorrectionsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [corrections, setCorrections] = useState<CorrectionRequest[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    fetchCorrections()
  }, [statusFilter])

  const fetchCorrections = async () => {
    try {
      setLoading(true)
      const params = statusFilter ? { status: statusFilter } : undefined
      const response = await apiClient.getAllCorrectionRequests(params)
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
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.user.fullName}</div>
          <div className="text-gray-500 text-sm">{record.user.employeeCode}</div>
          <div className="text-gray-400 text-xs">{record.user.department}</div>
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
      render: (date) => dayjs(date).format('MMM DD, hh:mm A')
    }
  ]

  return (
    <DashboardLayout role={user?.role || 'ROLE_ADMIN'}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">
          <ClockCircleOutlined /> All Correction Requests
        </h1>

        <Card
          title="Attendance Correction Requests"
          extra={
            <Select
              placeholder="Filter by status"
              style={{ width: 150 }}
              allowClear
              value={statusFilter || undefined}
              onChange={(value) => setStatusFilter(value || '')}
            >
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="approved">Approved</Select.Option>
              <Select.Option value="rejected">Rejected</Select.Option>
            </Select>
          }
        >
          <Table
            columns={columns}
            dataSource={corrections}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 15,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} requests`
            }}
          />
        </Card>
      </div>
    </DashboardLayout>
  )
}
