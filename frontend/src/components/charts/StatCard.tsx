'use client'

import React from 'react'
import { Card } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  trend?: string
  isUp?: boolean
  onClick?: () => void
}

export default function StatCard({ title, value, icon, color, trend, isUp, onClick }: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    pink: 'from-pink-500 to-pink-600',
    indigo: 'from-indigo-500 to-indigo-600',
    yellow: 'from-yellow-500 to-yellow-600',
    teal: 'from-teal-500 to-teal-600',
    cyan: 'from-cyan-500 to-cyan-600',
  }

  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white dark:bg-gray-800"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">{value}</h3>
          {trend && (
            <div className="flex items-center gap-1">
              {isUp ? (
                <ArrowUpOutlined className="text-green-500" />
              ) : (
                <ArrowDownOutlined className="text-red-500" />
              )}
              <span className={`text-sm ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                {trend}
              </span>
            </div>
          )}
        </div>
        <div className={`w-16 h-16 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue} rounded-2xl flex items-center justify-center shadow-lg`}>
          <span className="text-white text-2xl">{icon}</span>
        </div>
      </div>
    </Card>
  )
}
