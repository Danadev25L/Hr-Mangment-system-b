'use client'

import React from 'react'
import { ReloadOutlined, ClearOutlined } from '@ant-design/icons'
import {
  FilterBar,
  FilterSelect,
  EnhancedButton,
} from '@/components/ui'
import dayjs from 'dayjs'

interface SalaryFiltersProps {
  role: 'admin' | 'manager'
  filters: {
    month: number
    year: number
    status?: string
    department?: string
  }
  departments?: any[]
  onFilterChange: (key: string, value: any) => void
  onReset: () => void
  onRefresh: () => void
  isLoading?: boolean
}

export const SalaryFilters: React.FC<SalaryFiltersProps> = ({
  role,
  filters,
  departments = [],
  onFilterChange,
  onReset,
  onRefresh,
  isLoading = false,
}) => {
  const currentDate = dayjs()
  
  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    label: dayjs().month(i).format('MMMM'),
    value: i + 1,
  }))
  
  // Generate year options (current year and 4 previous years)
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = currentDate.year() - i
    return { label: year.toString(), value: year }
  })

  return (
    <FilterBar>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 font-medium">Period:</span>
        <FilterSelect
          placeholder="Month"
          options={monthOptions}
          value={filters.month}
          onChange={(value) => onFilterChange('month', value)}
          className="w-32"
        />
        <FilterSelect
          placeholder="Year"
          options={yearOptions}
          value={filters.year}
          onChange={(value) => onFilterChange('year', value)}
          className="w-24"
        />
      </div>
      
      {role === 'admin' && departments.length > 0 && (
        <FilterSelect
          placeholder="Department"
          options={departments.map((dept: any) => ({
            label: dept.departmentName || dept.name,
            value: dept.departmentName || dept.name,
          }))}
          value={filters.department}
          onChange={(value) => onFilterChange('department', value)}
        />
      )}
      
      <div className="ml-auto flex gap-2">
        <EnhancedButton
          variant="ghost"
          icon={<ReloadOutlined />}
          onClick={onRefresh}
          loading={isLoading}
        >
          Refresh
        </EnhancedButton>
        <EnhancedButton
          variant="secondary"
          icon={<ClearOutlined />}
          onClick={onReset}
        >
          Reset
        </EnhancedButton>
      </div>
    </FilterBar>
  )
}
