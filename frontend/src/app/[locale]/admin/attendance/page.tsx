'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Row, Col, Button, Spin } from 'antd'
import { 
  ClockCircleOutlined, 
  UserOutlined, 
  EditOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'

export default function AdminAttendancePage() {
  const router = useRouter()
  const { user } = useAuth()

  // Auto-redirect to manage page
  useEffect(() => {
    router.push('/admin/attendance/manage')
  }, [router])

  return (
    <DashboardLayout role={user?.role || 'ROLE_ADMIN'}>
      <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
        <Spin size="large" tip="Redirecting to Attendance Management..." spinning={true} fullscreen={false}>
          <div style={{ width: '100px', height: '100px' }} />
        </Spin>
      </div>
    </DashboardLayout>
  )
}
