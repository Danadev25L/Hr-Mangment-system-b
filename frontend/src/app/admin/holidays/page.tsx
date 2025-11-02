'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { HolidayListPage } from '@/components/holidays/HolidayListPage'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

export default function AdminHolidaysPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="admin">
        <HolidayListPage role="admin" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
