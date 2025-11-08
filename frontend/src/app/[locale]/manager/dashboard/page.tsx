'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import ManagerDashboard from '@/components/dashboard/ManagerDashboard'

export default function ManagerDashboardPage() {
  return (
    <DashboardLayout role="ROLE_MANAGER">
      <ManagerDashboard />
    </DashboardLayout>
  )
}