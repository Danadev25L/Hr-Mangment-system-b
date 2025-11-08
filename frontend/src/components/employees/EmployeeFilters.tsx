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
import { useTranslations } from 'next-intl'

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
  const t = useTranslations()
  
  return (
    <FilterBar>
      <FilterSelect
        placeholder={t('employees.role')}
        options={[
          ...(role === 'admin' ? [{ label: t('employees.admin'), value: 'ROLE_ADMIN' }] : []),
          { label: t('employees.manager'), value: 'ROLE_MANAGER' },
          { label: t('employees.roleEmployee'), value: 'ROLE_EMPLOYEE' },
        ]}
        value={filters.role}
        onChange={(value) => onFilterChange('role', value)}
      />
      
      <FilterSelect
        placeholder={t('common.status')}
        options={[
          { label: t('employees.active'), value: 'active' },
          { label: t('employees.inactive'), value: 'inactive' },
        ]}
        value={filters.status}
        onChange={(value) => onFilterChange('status', value)}
      />
      
      {role === 'admin' && departments.length > 0 && (
        <FilterSelect
          placeholder={t('employees.department')}
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
        placeholder={[t('attendance.from'), t('attendance.to')]}
      />
      
      <div className="ml-auto flex gap-2">
        <EnhancedButton
          variant="ghost"
          icon={<ReloadOutlined />}
          onClick={onRefresh}
          loading={isLoading}
        >
          {t('employees.refresh')}
        </EnhancedButton>
        <EnhancedButton
          variant="secondary"
          icon={<ClearOutlined />}
          onClick={onReset}
        >
          {t('employees.reset')}
        </EnhancedButton>
      </div>
    </FilterBar>
  )
}
