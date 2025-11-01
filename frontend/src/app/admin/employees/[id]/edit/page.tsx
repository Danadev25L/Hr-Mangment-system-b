'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { EmployeeEditPage } from '@/components/employees/EmployeeEditPage'

export default function AdminEmployeeEditPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="ROLE_ADMIN">
        <EmployeeEditPage role="admin" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
