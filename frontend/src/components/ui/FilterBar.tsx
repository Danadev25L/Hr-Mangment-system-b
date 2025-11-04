'use client'

import React from 'react'
import { Select, DatePicker } from 'antd'
import { FilterOutlined } from '@ant-design/icons'
import { cn } from '@/lib/utils'
import { EnhancedCard } from './EnhancedCard'

const { RangePicker } = DatePicker

interface FilterBarProps {
  children?: React.ReactNode
  className?: string
}

export const FilterBar: React.FC<FilterBarProps> = ({
  children,
  className = '',
}) => {
  return (
    <>
      <EnhancedCard className={cn('filter-bar mb-6', className)} noPadding={false}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 font-medium">
            <FilterOutlined className="text-lg" />
            <span>Filters:</span>
          </div>
          <div className="flex-1 flex items-center gap-3 flex-wrap">
            {children}
          </div>
        </div>
      </EnhancedCard>
      <style jsx global>{`
        .filter-bar .ant-select {
          min-width: 180px;
        }
        
        .filter-bar .ant-select-selector {
          border-radius: 8px !important;
          border: 2px solid rgb(229 231 235) !important;
          transition: all 0.3s ease !important;
        }
        
        .filter-bar .ant-select-selector:hover {
          border-color: rgb(59 130 246) !important;
        }
        
        .filter-bar .ant-select-focused .ant-select-selector {
          border-color: rgb(59 130 246) !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
        }
        
        .filter-bar .ant-picker {
          border-radius: 8px !important;
          border: 2px solid rgb(229 231 235) !important;
          transition: all 0.3s ease !important;
        }
        
        .filter-bar .ant-picker:hover {
          border-color: rgb(59 130 246) !important;
        }
        
        .filter-bar .ant-picker-focused {
          border-color: rgb(59 130 246) !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
        }
        
        .dark .filter-bar .ant-select-selector {
          background: rgb(31 41 55) !important;
          border-color: rgb(55 65 81) !important;
          color: rgb(243 244 246) !important;
        }
        
        .dark .filter-bar .ant-picker {
          background: rgb(31 41 55) !important;
          border-color: rgb(55 65 81) !important;
          color: rgb(243 244 246) !important;
        }
      `}</style>
    </>
  )
}

// Pre-styled filter components for common use cases
interface FilterSelectProps {
  placeholder?: string
  options: Array<{ label: string; value: string | number }>
  value?: string | number
  onChange?: (value: string | number) => void
  allowClear?: boolean
  className?: string
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
  placeholder = 'Select...',
  options,
  value,
  onChange,
  allowClear = true,
  className = '',
}) => {
  return (
    <Select
      placeholder={placeholder}
      options={options}
      value={value}
      onChange={onChange}
      allowClear={allowClear}
      className={className}
    />
  )
}

interface FilterDateRangeProps {
  value?: [any, any]
  onChange?: (dates: [any, any] | null) => void
  placeholder?: [string, string]
  className?: string
}

export const FilterDateRange: React.FC<FilterDateRangeProps> = ({
  value,
  onChange,
  placeholder = ['Start Date', 'End Date'],
  className = '',
}) => {
  return (
    <RangePicker
      value={value}
      onChange={onChange as any}
      placeholder={placeholder}
      className={className}
    />
  )
}
