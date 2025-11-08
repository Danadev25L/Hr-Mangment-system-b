'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import AdminDashboard from '@/components/dashboard/AdminDashboard'

export default function AdminDashboardPage() {
  return (
    <DashboardLayout role="ROLE_ADMIN">
      <AdminDashboard />
    </DashboardLayout>
  )
}
