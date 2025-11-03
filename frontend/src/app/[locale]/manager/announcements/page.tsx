import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AnnouncementListPage } from '@/components/announcements/AnnouncementListPage'

export default function ManagerAnnouncementsPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_MANAGER">
      <DashboardLayout role="ROLE_MANAGER">
        <AnnouncementListPage role="manager" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
