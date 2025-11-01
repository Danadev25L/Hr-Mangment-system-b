'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { ApplicationViewPage } from '@/components/applications'

export default function AdminApplicationViewPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="ROLE_ADMIN">
        <ApplicationViewPage role="admin" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
