import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AnnouncementListPage } from '@/components/announcements/AnnouncementListPage'
import { getTranslations } from 'next-intl/server'

export default async function AdminAnnouncementsPage() {
  const t = await getTranslations()
  
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
