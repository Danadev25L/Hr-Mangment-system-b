'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { EmployeeListPage } from '@/components/employees/EmployeeListPage'

export default function AdminEmployeesPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="ROLE_ADMIN">
        <EmployeeListPage
          role="admin"
          title="Employee Management"
          description="Manage all employees across the organization"
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
