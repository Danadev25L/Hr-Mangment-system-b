'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { EmployeeListPage } from '@/components/employees/EmployeeListPage'
import { useTranslations } from 'next-intl'

export default function ManagerEmployeesPage() {
  const t = useTranslations()
  
  return (
    <ProtectedRoute requiredRole="ROLE_MANAGER">
      <DashboardLayout role="ROLE_MANAGER">
        <EmployeeListPage 
          role="manager"
          title={t('employees.myTeam')}
          description={t('employees.subtitleManager')}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
