import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AnnouncementListPage } from '@/components/announcements/AnnouncementListPage'
import { useTranslations } from 'next-intl'

export default function AdminAnnouncementsPage() {
  const t = useTranslations()
  
  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="ROLE_ADMIN">
        <AnnouncementListPage 
          role="admin"
          title={t('announcements.allAnnouncements')}
          description={t('announcements.subtitle')}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
