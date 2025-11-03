'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { HolidayViewPage } from '@/components/holidays/HolidayViewPage'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

export default function EmployeeHolidayViewPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute requiredRole="ROLE_EMPLOYEE">
      <DashboardLayout role="employee">
        <HolidayViewPage role="employee" id={params.id} />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
