'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { ApplicationViewPage } from '@/components/applications'

export default function ManagerApplicationViewPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_MANAGER">
      <DashboardLayout role="ROLE_MANAGER">
        <ApplicationViewPage role="manager" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
