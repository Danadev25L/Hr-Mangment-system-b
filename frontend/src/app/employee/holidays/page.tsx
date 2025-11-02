'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { HolidayListPage } from '@/components/holidays/HolidayListPage'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

export default function EmployeeHolidaysPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_EMPLOYEE">
      <DashboardLayout role="employee">
        <HolidayListPage role="employee" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
