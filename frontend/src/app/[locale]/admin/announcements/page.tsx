import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AnnouncementListPage } from '@/components/announcements/AnnouncementListPage'

export default function AdminAnnouncementsPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="ROLE_ADMIN">
        <AnnouncementListPage role="admin" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
