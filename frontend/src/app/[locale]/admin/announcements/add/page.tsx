import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AnnouncementAddPage } from '@/components/announcements/AnnouncementAddPage'
import { getTranslations } from 'next-intl/server'

export default async function AdminAnnouncementAddPage() {
  const t = await getTranslations()
  
  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="ROLE_ADMIN">
        <AnnouncementAddPage 
          role="admin"
          title={t('announcements.createAnnouncement')}
          description={t('announcements.subtitleAdd')}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
