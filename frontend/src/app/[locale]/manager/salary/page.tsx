'use client'

import SalaryListPage from '@/components/salary/SalaryListPage'
import { useTranslations } from 'next-intl'

export default function ManagerSalaryPage() {
  const t = useTranslations()
  
  return (
    <SalaryListPage 
      role="ROLE_MANAGER" 
      title={t('navigation.salaryList')}
      description="View employee salaries and compensation details"
    />
  )
}
