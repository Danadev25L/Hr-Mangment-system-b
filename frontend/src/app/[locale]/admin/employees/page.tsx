'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { EmployeeListPage } from '@/components/employees/EmployeeListPage'
import { useTranslations } from 'next-intl'

export default function AdminEmployeesPage() {
  const t = useTranslations()
  
  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="ROLE_ADMIN">
        <EmployeeListPage
          role="admin"
          title={t('employees.title')}
          description={t('employees.subtitle')}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
