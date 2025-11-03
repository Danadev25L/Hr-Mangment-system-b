'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { AnnouncementViewPage } from '@/components/announcements/AnnouncementViewPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function EmployeeAnnouncementViewPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute allowedRoles={['ROLE_EMPLOYEE']}>
      <DashboardLayout role="employee">
        <AnnouncementViewPage role="employee" id={params.id} />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
