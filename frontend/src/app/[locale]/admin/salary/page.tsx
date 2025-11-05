'use client'

import SalaryListPage from '@/components/salary/SalaryListPage'
import { useTranslations } from 'next-intl'

export default function AdminSalaryPage() {
  const t = useTranslations()
  
  return (
    <SalaryListPage 
      role="ROLE_ADMIN" 
      title={t('navigation.salaryList')}
      description="View and manage employee salaries, bonuses, and deductions"
    />
  )
}
