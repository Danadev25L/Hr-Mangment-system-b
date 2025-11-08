'use client'

import React from 'react'
import { Card } from 'antd'
import { Pie } from 'react-chartjs-2'

interface PieChartCardProps {
  title: string
  subtitle?: string
  data: any
  height?: number
}

export default function PieChartCard({ title, subtitle, data, height = 300 }: PieChartCardProps) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgb(107, 114, 128)',
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    }
  }

  return (
    <Card 
      className="shadow-lg border-0 bg-white dark:bg-gray-800 transition-colors"
      title={
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
      }
    >
      <div className="chart-container" style={{ height: `${height}px` }}>
        <Pie data={data} options={options} />
      </div>
    </Card>
  )
}
