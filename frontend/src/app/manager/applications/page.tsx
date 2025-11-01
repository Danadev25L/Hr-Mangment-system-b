'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import ApplicationListPage from '@/components/applications/ApplicationListPage'

export default function ManagerApplicationsPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_MANAGER">
      <DashboardLayout role="ROLE_MANAGER">
        <ApplicationListPage 
          role="manager"
          title="Department Applications"
          description="Manage applications for your department"
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
