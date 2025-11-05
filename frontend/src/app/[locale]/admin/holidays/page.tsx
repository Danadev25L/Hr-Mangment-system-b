'use client'

import { useTranslations } from 'next-intl'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { HolidayListPage } from '@/components/holidays/HolidayListPage'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

export default function AdminHolidaysPage() {
  const t = useTranslations()

  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="admin">
        <HolidayListPage 
          role="admin"
          title={t('holidays.allHolidays')}
          description={t('holidays.subtitle')}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
