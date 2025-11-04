'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { AnnouncementEditPage } from '@/components/announcements/AnnouncementEditPage'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

export default function ManagerAnnouncementEditPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute requiredRole="ROLE_MANAGER">
      <DashboardLayout role="manager">
        <AnnouncementEditPage role="manager" id={params.id} />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
