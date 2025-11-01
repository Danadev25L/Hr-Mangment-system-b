'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { ApplicationAddPage } from '@/components/applications'

export default function ManagerApplicationAddPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_MANAGER">
      <DashboardLayout role="ROLE_MANAGER">
        <ApplicationAddPage role="manager" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
