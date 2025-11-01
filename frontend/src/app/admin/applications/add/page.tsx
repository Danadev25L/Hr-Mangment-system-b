'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { ApplicationAddPage } from '@/components/applications'

export default function AdminApplicationAddPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="ROLE_ADMIN">
        <ApplicationAddPage role="admin" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
