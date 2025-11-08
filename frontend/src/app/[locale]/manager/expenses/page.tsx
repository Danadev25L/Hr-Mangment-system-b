'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import ExpenseListPage from '@/components/expenses/ExpenseListPage'
import { useTranslations } from 'next-intl'

export default function ManagerExpensesPage() {
  const t = useTranslations()
  
  return (
    <ProtectedRoute requiredRole="ROLE_MANAGER">
      <DashboardLayout role="ROLE_MANAGER">
        <ExpenseListPage 
          role="manager"
          title={t('expenses.teamExpenses')}
          description={t('expenses.subtitleManager')}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
