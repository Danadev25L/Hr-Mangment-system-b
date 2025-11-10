'use client'

import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

// Dynamically import NotificationsPage with SSR disabled to prevent hydration errors
const NotificationsPage = dynamic(
  () => import('@/components/notifications/NotificationsPage').then(mod => ({ default: mod.NotificationsPage })),
  { ssr: false }
)

export default function ManagerNotificationsPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_MANAGER">
      <DashboardLayout role="ROLE_MANAGER">
        <NotificationsPage role="ROLE_MANAGER" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
