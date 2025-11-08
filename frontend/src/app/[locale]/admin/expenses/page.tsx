'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import ExpenseListPage from '@/components/expenses/ExpenseListPage'
import { useTranslations } from 'next-intl'

export default function AdminExpensesPage() {
  const t = useTranslations()
  
  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="ROLE_ADMIN">
        <ExpenseListPage 
          role="admin"
          title={t('expenses.title')}
          description={t('expenses.subtitle')}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
