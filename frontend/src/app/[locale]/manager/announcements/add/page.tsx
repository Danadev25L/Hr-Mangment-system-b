import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AnnouncementAddPage } from '@/components/announcements/AnnouncementAddPage'

export default function ManagerAnnouncementAddPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_MANAGER">
      <DashboardLayout role="ROLE_MANAGER">
        <AnnouncementAddPage role="manager" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
