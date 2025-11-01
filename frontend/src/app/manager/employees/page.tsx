'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { EmployeeListPage } from '@/components/employees/EmployeeListPage'

export default function ManagerEmployeesPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_MANAGER">
      <DashboardLayout role="ROLE_MANAGER">
        <EmployeeListPage 
          role="manager"
          title="My Team"
          description="Manage your department employees"
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
