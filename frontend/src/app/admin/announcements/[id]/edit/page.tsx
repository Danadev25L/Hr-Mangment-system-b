'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { AnnouncementEditPage } from '@/components/announcements/AnnouncementEditPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function AdminAnnouncementEditPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
      <DashboardLayout role="admin">
        <AnnouncementEditPage role="admin" id={params.id} />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
