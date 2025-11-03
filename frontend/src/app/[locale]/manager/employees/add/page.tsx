'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { EmployeeAddPage } from '@/components/employees/EmployeeAddPage'

export default function ManagerAddEmployeePage() {
  return (
    <ProtectedRoute requiredRole="ROLE_MANAGER">
      <DashboardLayout role="ROLE_MANAGER">
        <EmployeeAddPage role="manager" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
