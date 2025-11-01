import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AnnouncementListPage } from '@/components/announcements/AnnouncementListPage'

export default function EmployeeAnnouncementsPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_EMPLOYEE">
      <DashboardLayout role="ROLE_EMPLOYEE">
        <AnnouncementListPage role="employee" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
