import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AnnouncementAddPage } from '@/components/announcements/AnnouncementAddPage'
import { useTranslations } from 'next-intl'

export default function AdminAnnouncementAddPage() {
  const t = useTranslations()
  
  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="ROLE_ADMIN">
        <AnnouncementAddPage 
          role="admin"
          title={t('announcements.createAnnouncement')}
          description={t('announcements.subtitle')}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
