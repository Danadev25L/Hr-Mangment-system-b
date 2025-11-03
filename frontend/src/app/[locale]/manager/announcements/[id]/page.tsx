'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { AnnouncementViewPage } from '@/components/announcements/AnnouncementViewPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function ManagerAnnouncementViewPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute allowedRoles={['ROLE_MANAGER']}>
      <DashboardLayout role="manager">
        <AnnouncementViewPage role="manager" id={params.id} />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
