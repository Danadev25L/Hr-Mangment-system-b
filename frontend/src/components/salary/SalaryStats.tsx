'use client'

import React from 'react'
import { StatCard } from '@/components/ui'
import { 
  TeamOutlined, 
  DollarOutlined, 
  RiseOutlined,
  TrophyOutlined 
} from '@ant-design/icons'
import { useTranslations } from 'next-intl'

interface SalaryStatsProps {
  totalEmployees: number
  totalGrossSalary: number
  totalNetSalary: number
  totalBonuses: number
}

export const SalaryStats: React.FC<SalaryStatsProps> = ({
  totalEmployees,
  totalGrossSalary,
  totalNetSalary,
  totalBonuses,
}) => {
  const t = useTranslations()
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title={t('salary.totalEmployees')}
        value={totalEmployees}
        icon={<TeamOutlined />}
        color="blue"
      />
      <StatCard
        title={t('salary.totalGrossSalary')}
        value={`$${totalGrossSalary.toLocaleString()}`}
        icon={<RiseOutlined />}
        color="green"
      />
      <StatCard
        title={t('salary.totalNetSalary')}
        value={`$${totalNetSalary.toLocaleString()}`}
        icon={<DollarOutlined />}
        color="cyan"
      />
      <StatCard
        title={t('salary.totalBonuses')}
        value={`$${totalBonuses.toLocaleString()}`}
        icon={<TrophyOutlined />}
        color="orange"
      />
    </div>
  )
}
