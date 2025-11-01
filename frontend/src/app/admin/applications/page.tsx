'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import ApplicationListPage from '@/components/applications/ApplicationListPage'

export default function AdminApplicationsPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="ROLE_ADMIN">
        <ApplicationListPage 
          role="admin"
          title="Application Management"
          description="Manage all applications across the organization"
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
