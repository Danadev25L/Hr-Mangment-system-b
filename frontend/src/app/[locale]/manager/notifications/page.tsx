'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { NotificationsPage } from '@/components/notifications/NotificationsPage'

export default function ManagerNotificationsPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_MANAGER">
      <DashboardLayout role="ROLE_MANAGER">
        <NotificationsPage role="ROLE_MANAGER" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
