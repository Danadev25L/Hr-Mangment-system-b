'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import ExpenseAddPage from '@/components/expenses/ExpenseAddPage'

export default function AdminAddExpensePage() {
  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="ROLE_ADMIN">
        <ExpenseAddPage role="admin" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
