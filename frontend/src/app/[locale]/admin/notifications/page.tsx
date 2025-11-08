'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { NotificationsPage } from '@/components/notifications/NotificationsPage'

export default function AdminNotificationsPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="ROLE_ADMIN">
        <NotificationsPage role="ROLE_ADMIN" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
