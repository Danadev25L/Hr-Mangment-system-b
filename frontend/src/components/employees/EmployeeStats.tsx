'use client'

import React from 'react'
import { StatCard } from '@/components/ui'
import { UserOutlined } from '@ant-design/icons'
import type { User } from '@/types'

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
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <StatCard
        title="Total Employees"
        value={totalEmployees}
        icon={<UserOutlined />}
        color="blue"
      />
      <StatCard
        title="Active"
        value={activeCount}
        icon={<UserOutlined />}
        color="green"
      />
      <StatCard
        title="Inactive"
        value={inactiveCount}
        icon={<UserOutlined />}
        color="red"
      />
    </div>
  )
}
