'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { HolidayEditPage } from '@/components/holidays/HolidayEditPage'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

export default function AdminHolidayEditPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="admin">
        <HolidayEditPage id={params.id} />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
