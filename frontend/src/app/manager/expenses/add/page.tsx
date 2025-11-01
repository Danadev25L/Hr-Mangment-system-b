'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import ExpenseAddPage from '@/components/expenses/ExpenseAddPage'

export default function ManagerAddExpensePage() {
  return (
    <ProtectedRoute requiredRole="ROLE_MANAGER">
      <DashboardLayout role="ROLE_MANAGER">
        <ExpenseAddPage role="manager" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
