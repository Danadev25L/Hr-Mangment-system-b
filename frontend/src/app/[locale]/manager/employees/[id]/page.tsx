'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { EmployeeViewPage } from '@/components/employees/EmployeeViewPage'

export default function ManagerEmployeeViewPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_MANAGER">
      <DashboardLayout role="ROLE_MANAGER">
        <EmployeeViewPage role="manager" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
