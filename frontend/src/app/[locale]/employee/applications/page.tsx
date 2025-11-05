'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import ApplicationListPage from '@/components/applications/ApplicationListPage'

export default function EmployeeApplicationsPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_EMPLOYEE">
      <DashboardLayout role="ROLE_EMPLOYEE">
        <ApplicationListPage
          role="employee"
          title="My Applications"
          description="View and manage your application requests"
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
