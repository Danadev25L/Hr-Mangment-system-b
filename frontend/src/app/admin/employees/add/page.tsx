'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { EmployeeAddPage } from '@/components/employees/EmployeeAddPage'

export default function AdminAddEmployeePage() {
  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="ROLE_ADMIN">
        <EmployeeAddPage role="admin" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
