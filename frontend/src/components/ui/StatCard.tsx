'use client'

import React from 'react'
import { Statistic, StatisticProps } from 'antd'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan'
  className?: string
}

const colorClasses = {
  blue: {
    bg: 'from-blue-500 to-blue-600',
    light: 'bg-blue-50 dark:bg-blue-950',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    bg: 'from-green-500 to-green-600',
    light: 'bg-green-50 dark:bg-green-950',
    icon: 'text-green-600 dark:text-green-400',
  },
  purple: {
    bg: 'from-purple-500 to-purple-600',
    light: 'bg-purple-50 dark:bg-purple-950',
    icon: 'text-purple-600 dark:text-purple-400',
  },
  orange: {
    bg: 'from-orange-500 to-orange-600',
    light: 'bg-orange-50 dark:bg-orange-950',
    icon: 'text-orange-600 dark:text-orange-400',
  },
  red: {
    bg: 'from-red-500 to-red-600',
    light: 'bg-red-50 dark:bg-red-950',
    icon: 'text-red-600 dark:text-red-400',
  },
  cyan: {
    bg: 'from-cyan-500 to-cyan-600',
    light: 'bg-cyan-50 dark:bg-cyan-950',
    icon: 'text-cyan-600 dark:text-cyan-400',
  },
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'blue',
  className = '',
}) => {
  const colors = colorClasses[color]

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {value}
          </h3>
          {trend && (
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'w-16 h-16 rounded-xl flex items-center justify-center',
            colors.light
          )}
        >
          <div className={cn('text-3xl', colors.icon)}>{icon}</div>
        </div>
      </div>
    </div>
  )
}
