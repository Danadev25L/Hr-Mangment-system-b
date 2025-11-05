import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AnnouncementAddPage } from '@/components/announcements/AnnouncementAddPage'
import { useTranslations } from 'next-intl'

export default function ManagerAnnouncementAddPage() {
  const t = useTranslations()
  
  return (
    <ProtectedRoute requiredRole="ROLE_MANAGER">
      <DashboardLayout role="ROLE_MANAGER">
        <AnnouncementAddPage 
          role="manager"
          title={t('announcements.createAnnouncement')}
          description={t('announcements.subtitleManager')}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
