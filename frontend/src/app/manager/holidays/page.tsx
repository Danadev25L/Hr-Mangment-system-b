'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { HolidayListPage } from '@/components/holidays/HolidayListPage'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

export default function ManagerHolidaysPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_MANAGER">
      <DashboardLayout role="manager">
        <HolidayListPage role="manager" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
