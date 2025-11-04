'use client'

import { Card, Row, Col, Statistic } from 'antd'
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'

interface ApplicationStatsProps {
  total: number
  pending: number
  approved: number
  rejected: number
}

export function ApplicationStats({ total, pending, approved, rejected }: ApplicationStatsProps) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
          <Statistic
            title={<span className="text-gray-600 font-medium">Total Applications</span>}
            value={total}
            prefix={<FileTextOutlined className="text-blue-500" />}
            valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
          <Statistic
            title={<span className="text-gray-600 font-medium">Pending</span>}
            value={pending}
            prefix={<ClockCircleOutlined className="text-orange-500" />}
            valueStyle={{ color: '#fa8c16', fontWeight: 'bold' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
          <Statistic
            title={<span className="text-gray-600 font-medium">Approved</span>}
            value={approved}
            prefix={<CheckCircleOutlined className="text-green-500" />}
            valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
          <Statistic
            title={<span className="text-gray-600 font-medium">Rejected</span>}
            value={rejected}
            prefix={<CloseCircleOutlined className="text-red-500" />}
            valueStyle={{ color: '#ff4d4f', fontWeight: 'bold' }}
          />
        </Card>
      </Col>
    </Row>
  )
}
