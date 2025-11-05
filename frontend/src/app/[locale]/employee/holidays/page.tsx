'use client'

import { useTranslations } from 'next-intl'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { HolidayListPage } from '@/components/holidays/HolidayListPage'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

export default function EmployeeHolidaysPage() {
  const t = useTranslations()

  return (
    <ProtectedRoute requiredRole="ROLE_EMPLOYEE">
      <DashboardLayout role="employee">
        <HolidayListPage 
          role="employee"
          title={t('holidays.companyHolidays')}
          description={t('holidays.subtitleEmployee')}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
