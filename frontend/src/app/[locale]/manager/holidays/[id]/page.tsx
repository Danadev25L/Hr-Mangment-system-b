'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { HolidayViewPage } from '@/components/holidays/HolidayViewPage'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

export default function ManagerHolidayViewPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute requiredRole="ROLE_MANAGER">
      <DashboardLayout role="manager">
        <HolidayViewPage role="manager" id={params.id} />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
