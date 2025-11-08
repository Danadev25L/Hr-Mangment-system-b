'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import EmployeeDashboard from '@/components/dashboard/EmployeeDashboard'

export default function EmployeeDashboardPage() {
  return (
    <DashboardLayout role="ROLE_EMPLOYEE">
      <EmployeeDashboard />
    </DashboardLayout>
  )
}