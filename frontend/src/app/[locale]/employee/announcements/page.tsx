import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AnnouncementListPage } from '@/components/announcements/AnnouncementListPage'
import { useTranslations } from 'next-intl'

export default function EmployeeAnnouncementsPage() {
  const t = useTranslations()
  
  return (
    <ProtectedRoute requiredRole="ROLE_EMPLOYEE">
      <DashboardLayout role="ROLE_EMPLOYEE">
        <AnnouncementListPage 
          role="employee"
          title={t('announcements.myAnnouncements')}
          description={t('announcements.subtitleEmployee')}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
