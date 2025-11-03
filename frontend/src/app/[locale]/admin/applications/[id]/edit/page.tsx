'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { ApplicationEditPage } from '@/components/applications'

export default function AdminApplicationEditPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="ROLE_ADMIN">
        <ApplicationEditPage role="admin" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
