'use client'

import React from 'react'
import { StatCard } from '@/components/ui'
import { UserOutlined } from '@ant-design/icons'
import type { User } from '@/types'
import { useTranslations } from 'next-intl'

interface EmployeeStatsProps {
  totalEmployees: number
  activeCount: number
  inactiveCount: number
}

export const EmployeeStats: React.FC<EmployeeStatsProps> = ({
  totalEmployees,
  activeCount,
  inactiveCount,
}) => {
  const t = useTranslations()
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <StatCard
        title={t('employees.totalEmployees')}
        value={totalEmployees}
        icon={<UserOutlined />}
        color="blue"
      />
      <StatCard
        title={t('employees.active')}
        value={activeCount}
        icon={<UserOutlined />}
        color="green"
      />
      <StatCard
        title={t('employees.inactive')}
        value={inactiveCount}
        icon={<UserOutlined />}
        color="red"
      />
    </div>
  )
}
