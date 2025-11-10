import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AnnouncementAddPage } from '@/components/announcements/AnnouncementAddPage'
import { getTranslations } from 'next-intl/server'

export default async function ManagerAnnouncementAddPage() {
  const t = await getTranslations()
  
  return (
    <ProtectedRoute requiredRole="ROLE_MANAGER">
      <DashboardLayout role="ROLE_MANAGER">
        <AnnouncementAddPage 
          role="manager"
          title={t('announcements.createAnnouncement')}
          description={t('announcements.subtitleAddManager')}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
