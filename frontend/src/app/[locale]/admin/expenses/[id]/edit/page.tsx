'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { ExpenseEditPage } from '@/components/expenses/ExpenseEditPage'

export default function AdminExpenseEditPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="ROLE_ADMIN">
        <ExpenseEditPage role="admin" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
