'use client'

import React from 'react'
import { StatCard } from '@/components/ui'
import { DollarOutlined, ClockCircleOutlined, CheckCircleOutlined, WalletOutlined } from '@ant-design/icons'

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
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Expenses"
        value={totalExpenses}
        icon={<DollarOutlined />}
        color="blue"
      />
      <StatCard
        title="Pending"
        value={pendingCount}
        icon={<ClockCircleOutlined />}
        color="orange"
      />
      <StatCard
        title="Approved"
        value={approvedCount}
        icon={<CheckCircleOutlined />}
        color="green"
      />
      <StatCard
        title="Total Amount"
        value={`$${totalAmount.toFixed(2)}`}
        icon={<WalletOutlined />}
        color="purple"
      />
    </div>
  )
}
