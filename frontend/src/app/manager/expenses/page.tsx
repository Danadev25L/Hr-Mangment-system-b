'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import ExpenseListPage from '@/components/expenses/ExpenseListPage'

export default function ManagerExpensesPage() {
  return (
    <ProtectedRoute requiredRole="ROLE_MANAGER">
      <DashboardLayout role="ROLE_MANAGER">
        <ExpenseListPage 
          role="manager"
          title="Department Expenses"
          description="Manage expenses for your department"
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
