'use client'

import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

// Dynamically import NotificationsPage with SSR disabled to prevent hydration errors
const NotificationsPage = dynamic(
  () => import('@/components/notifications/NotificationsPage').then(mod => ({ default: mod.NotificationsPage })),
  { ssr: false }
)

export default function EmployeeNotificationsPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_EMPLOYEE">
      <DashboardLayout role="ROLE_EMPLOYEE">
        <NotificationsPage role="ROLE_EMPLOYEE" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
