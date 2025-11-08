'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import ApplicationListPage from '@/components/applications/ApplicationListPage'
import { useTranslations } from 'next-intl'

export default function AdminApplicationsPage() {
  const t = useTranslations()
  
  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="ROLE_ADMIN">
        <ApplicationListPage 
          role="admin"
          title={t('applications.title')}
          description={t('applications.subtitle')}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
