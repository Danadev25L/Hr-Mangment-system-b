'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { EmployeeViewPage } from '@/components/employees/EmployeeViewPage'

export default function AdminEmployeeViewPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="ROLE_ADMIN">
        <EmployeeViewPage role="admin" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
