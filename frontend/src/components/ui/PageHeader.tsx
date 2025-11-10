'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  gradient?: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'cyan' | 'indigo' | 'amber'
  className?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon,
  action,
  gradient = 'blue',
  className = '',
}) => {
  const gradientClasses = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    cyan: 'from-cyan-500 to-cyan-600',
    indigo: 'from-indigo-500 to-indigo-600',
    amber: 'from-amber-500 to-amber-600',
  }

  return (
    <div
      className={cn(
        'bg-gradient-to-r text-white rounded-2xl p-4 md:p-8 mb-6 shadow-lg',
        gradientClasses[gradient],
        className
      )}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          {icon && (
            <div className="text-3xl md:text-5xl opacity-90 flex items-center justify-center flex-shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2">{title}</h1>
            {description && (
              <p className="text-white/90 text-sm md:text-base max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </div>
        {action && (
          <div className="flex-shrink-0 w-full md:w-auto">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}
