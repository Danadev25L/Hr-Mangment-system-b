'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { AnnouncementViewPage } from '@/components/announcements/AnnouncementViewPage'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

export default function AdminAnnouncementViewPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="admin">
        <AnnouncementViewPage role="admin" id={params.id} />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
