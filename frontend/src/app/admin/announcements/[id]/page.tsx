'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { AnnouncementViewPage } from '@/components/announcements/AnnouncementViewPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function AdminAnnouncementViewPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
      <DashboardLayout role="admin">
        <AnnouncementViewPage role="admin" id={params.id} />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
