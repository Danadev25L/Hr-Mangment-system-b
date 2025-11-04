'use client'

import React from 'react'
import { Select } from 'antd'
import { ReloadOutlined, ClearOutlined } from '@ant-design/icons'
import {
  FilterBar,
  FilterSelect,
  FilterDateRange,
  EnhancedButton,
} from '@/components/ui'
import dayjs from 'dayjs'

const { Option } = Select

interface EmployeeFiltersProps {
  role: 'admin' | 'manager'
  filters: {
    role?: string
    status?: string
    department?: string
  }
  dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null
  departments?: any[]
  onFilterChange: (key: string, value: any) => void
  onDateRangeChange: (dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => void
  onReset: () => void
  onRefresh: () => void
  isLoading?: boolean
}

export const EmployeeFilters: React.FC<EmployeeFiltersProps> = ({
  role,
  filters,
  dateRange,
  departments = [],
  onFilterChange,
  onDateRangeChange,
  onReset,
  onRefresh,
  isLoading = false,
}) => {
  return (
    <FilterBar>
      <FilterSelect
        placeholder="Role"
        options={[
          ...(role === 'admin' ? [{ label: 'Admin', value: 'ROLE_ADMIN' }] : []),
          { label: 'Manager', value: 'ROLE_MANAGER' },
          { label: 'Employee', value: 'ROLE_EMPLOYEE' },
        ]}
        value={filters.role}
        onChange={(value) => onFilterChange('role', value)}
      />
      
      <FilterSelect
        placeholder="Status"
        options={[
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ]}
        value={filters.status}
        onChange={(value) => onFilterChange('status', value)}
      />
      
      {role === 'admin' && departments.length > 0 && (
        <FilterSelect
          placeholder="Department"
          options={departments.map((dept: any) => ({
            label: dept.departmentName,
            value: dept.id.toString(),
          }))}
          value={filters.department}
          onChange={(value) => onFilterChange('department', value)}
        />
      )}
      
      <FilterDateRange
        value={dateRange as any}
        onChange={onDateRangeChange}
        placeholder={['Start Date', 'End Date']}
      />
      
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
