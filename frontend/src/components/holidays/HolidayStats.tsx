'use client'

import { Card, Row, Col, Statistic } from 'antd'
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons'

interface HolidayStatsProps {
  total: number
  upcoming: number
  past: number
  recurring: number
}

export function HolidayStats({ total, upcoming, past, recurring }: HolidayStatsProps) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
          <Statistic
            title={<span className="text-gray-600 font-medium">Total Holidays</span>}
            value={total}
            prefix={<CalendarOutlined className="text-blue-500" />}
            valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
          <Statistic
            title={<span className="text-gray-600 font-medium">Upcoming</span>}
            value={upcoming}
            prefix={<ClockCircleOutlined className="text-green-500" />}
            valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-gray-500">
          <Statistic
            title={<span className="text-gray-600 font-medium">Past</span>}
            value={past}
            prefix={<CheckCircleOutlined className="text-gray-500" />}
            valueStyle={{ color: '#8c8c8c', fontWeight: 'bold' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
          <Statistic
            title={<span className="text-gray-600 font-medium">Recurring</span>}
            value={recurring}
            prefix={<ReloadOutlined className="text-purple-500" />}
            valueStyle={{ color: '#722ed1', fontWeight: 'bold' }}
          />
        </Card>
      </Col>
    </Row>
  )
}
