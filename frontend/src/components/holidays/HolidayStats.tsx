'use client'

import { Card, Row, Col, Statistic } from 'antd'
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { useTranslations } from 'next-intl'

interface HolidayStatsProps {
  total: number
  upcoming: number
  past: number
}

export function HolidayStats({ total, upcoming, past }: HolidayStatsProps) {
  const t = useTranslations('holidays.stats')

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={8}>
        <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
          <Statistic
            title={<span className="text-gray-600 font-medium">{t('totalHolidays')}</span>}
            value={total}
            prefix={<CalendarOutlined className="text-blue-500" />}
            valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={8}>
        <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
          <Statistic
            title={<span className="text-gray-600 font-medium">{t('upcoming')}</span>}
            value={upcoming}
            prefix={<ClockCircleOutlined className="text-green-500" />}
            valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={8}>
        <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-gray-500">
          <Statistic
            title={<span className="text-gray-600 font-medium">{t('past')}</span>}
            value={past}
            prefix={<CheckCircleOutlined className="text-gray-500" />}
            valueStyle={{ color: '#8c8c8c', fontWeight: 'bold' }}
          />
        </Card>
      </Col>
    </Row>
  )
}
