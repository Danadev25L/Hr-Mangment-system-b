'use client'

import SalaryAdjustmentsPage from '@/components/salary/SalaryAdjustmentsPage'
import { useTranslations } from 'next-intl'

export default function AdminSalaryAdjustmentsPage() {
  const t = useTranslations()
  
  return (
    <SalaryAdjustmentsPage 
      role="admin" 
      title={t('navigation.salaryManagement') || 'Salary Management'}
      description="Add bonuses, deductions, overtime and manage employee salaries"
    />
  )
}
