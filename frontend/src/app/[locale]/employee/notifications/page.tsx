'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { NotificationsPage } from '@/components/notifications/NotificationsPage'

export default function EmployeeNotificationsPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_EMPLOYEE">
      <DashboardLayout role="ROLE_EMPLOYEE">
        <NotificationsPage />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
