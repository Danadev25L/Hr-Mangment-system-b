'use client'

import React from 'react'
import { StatCard } from '@/components/ui'
import { DollarOutlined, ClockCircleOutlined, CheckCircleOutlined, WalletOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'

interface ExpenseStatsProps {
  totalExpenses: number
  pendingCount: number
  approvedCount: number
  totalAmount: number
}

export const ExpenseStats: React.FC<ExpenseStatsProps> = ({
  totalExpenses,
  pendingCount,
  approvedCount,
  totalAmount,
}) => {
  const t = useTranslations()
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title={t('expenses.stats.totalExpenses')}
        value={totalExpenses}
        icon={<DollarOutlined />}
        color="blue"
      />
      <StatCard
        title={t('expenses.stats.pending')}
        value={pendingCount}
        icon={<ClockCircleOutlined />}
        color="orange"
      />
      <StatCard
        title={t('expenses.stats.approved')}
        value={approvedCount}
        icon={<CheckCircleOutlined />}
        color="green"
      />
      <StatCard
        title={t('expenses.stats.totalAmount')}
        value={`$${totalAmount.toFixed(2)}`}
        icon={<WalletOutlined />}
        color="purple"
      />
    </div>
  )
}
