'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { ExpenseViewPage } from '@/components/expenses/ExpenseViewPage'

export default function AdminExpenseViewPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="ROLE_ADMIN">
        <ExpenseViewPage role="admin" />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
