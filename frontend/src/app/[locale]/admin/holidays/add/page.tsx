'use client'

import { useTranslations } from 'next-intl'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { HolidayAddPage } from '@/components/holidays/HolidayAddPage'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

export default function AdminHolidayAddPage() {
  const t = useTranslations()

  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="admin">
        <HolidayAddPage 
          role="admin"
          title={t('holidays.addHoliday')}
          description={t('holidays.addSubtitle')}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
