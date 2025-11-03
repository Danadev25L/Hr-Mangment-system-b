'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { ExpenseViewPage } from '@/components/expenses/ExpenseViewPage'

export default function ManagerExpenseViewPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_MANAGER">
      <DashboardLayout role="ROLE_MANAGER">
        <ExpenseViewPage role="manager" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
