'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { HolidayViewPage } from '@/components/holidays/HolidayViewPage'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

export default function AdminHolidayViewPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="admin">
        <HolidayViewPage role="admin" id={params.id} />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
