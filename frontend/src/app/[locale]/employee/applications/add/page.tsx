'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { ApplicationAddPage } from '@/components/applications'

export default function EmployeeApplicationAddPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_EMPLOYEE">
      <DashboardLayout role="ROLE_EMPLOYEE">
        <ApplicationAddPage role="employee" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
