'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { ApplicationEditPage } from '@/components/applications'

export default function ManagerApplicationEditPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_MANAGER">
      <DashboardLayout role="ROLE_MANAGER">
        <ApplicationEditPage role="manager" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
