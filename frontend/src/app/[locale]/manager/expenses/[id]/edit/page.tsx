'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { ExpenseEditPage } from '@/components/expenses/ExpenseEditPage'

export default function ManagerExpenseEditPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_MANAGER">
      <DashboardLayout role="ROLE_MANAGER">
        <ExpenseEditPage role="manager" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
