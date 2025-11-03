import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AnnouncementAddPage } from '@/components/announcements/AnnouncementAddPage'

export default function AdminAnnouncementAddPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="ROLE_ADMIN">
        <AnnouncementAddPage role="admin" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
