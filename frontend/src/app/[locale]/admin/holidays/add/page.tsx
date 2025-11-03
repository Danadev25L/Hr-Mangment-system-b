'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { HolidayAddPage } from '@/components/holidays/HolidayAddPage'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

export default function AdminHolidayAddPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="admin">
        <HolidayAddPage />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
