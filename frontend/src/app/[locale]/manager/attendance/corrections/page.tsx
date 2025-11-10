'use client'

import { useState, useEffect } from 'react'
import { Card, Table, Tag, message } from 'antd'
import { 
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
    }
  ]

  return (
    <DashboardLayout role={user?.role || 'ROLE_MANAGER'}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">
          <ClockCircleOutlined /> Pending Correction Requests (View Only)
        </h1>
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Managers can view correction requests. Only admins can approve or reject requests.
          </p>
        </div>

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
      </div>
    </DashboardLayout>
  )
}