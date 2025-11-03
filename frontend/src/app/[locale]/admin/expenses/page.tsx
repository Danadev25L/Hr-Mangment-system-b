'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import ExpenseListPage from '@/components/expenses/ExpenseListPage'

export default function AdminExpensesPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="ROLE_ADMIN">
        <ExpenseListPage 
          role="admin"
          title="Expense Management"
          description="Manage all expenses across the organization"
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
