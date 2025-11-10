'use client'

import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

// Dynamically import NotificationsPage with SSR disabled to prevent hydration errors
const NotificationsPage = dynamic(
  () => import('@/components/notifications/NotificationsPage').then(mod => ({ default: mod.NotificationsPage })),
  { ssr: false }
)

export default function AdminNotificationsPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="ROLE_ADMIN">
        <NotificationsPage role="ROLE_ADMIN" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
