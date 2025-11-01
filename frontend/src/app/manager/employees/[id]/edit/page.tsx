'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { EmployeeEditPage } from '@/components/employees/EmployeeEditPage'

export default function ManagerEmployeeEditPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_MANAGER">
      <DashboardLayout role="ROLE_MANAGER">
        <EmployeeEditPage role="manager" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
