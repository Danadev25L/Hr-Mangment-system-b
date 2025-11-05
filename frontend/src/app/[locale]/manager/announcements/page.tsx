import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AnnouncementListPage } from '@/components/announcements/AnnouncementListPage'
import { useTranslations } from 'next-intl'

export default function ManagerAnnouncementsPage() {
  const t = useTranslations()
  
  return (
    <ProtectedRoute requiredRole="ROLE_MANAGER">
      <DashboardLayout role="ROLE_MANAGER">
        <AnnouncementListPage 
          role="manager"
          title={t('announcements.departmentAnnouncements')}
          description={t('announcements.subtitleManager')}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
