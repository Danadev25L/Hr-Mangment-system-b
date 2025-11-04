import dayjs from 'dayjs'

/**
 * Filter utilities for table data
 */

export const filterBySearch = <T extends Record<string, any>>(
  data: T[],
  searchText: string,
  searchFields: (keyof T)[]
): T[] => {
  if (!searchText) return data
  
  const lowerSearch = searchText.toLowerCase()
  return data.filter((item) =>
    searchFields.some((field) => {
      const value = item[field]
      if (value == null) return false
      return String(value).toLowerCase().includes(lowerSearch)
    })
  )
}

export const filterByDateRange = <T extends Record<string, any>>(
  data: T[],
  dateField: keyof T,
  startDate?: string | Date,
  endDate?: string | Date
): T[] => {
  if (!startDate && !endDate) return data
  
  return data.filter((item) => {
    const itemDate = dayjs(item[dateField] as any)
    if (!itemDate.isValid()) return false
    
    if (startDate && itemDate.isBefore(dayjs(startDate), 'day')) return false
    if (endDate && itemDate.isAfter(dayjs(endDate), 'day')) return false
    
    return true
  })
}

export const filterByStatus = <T extends Record<string, any>>(
  data: T[],
  statusField: keyof T,
  status?: string | boolean
): T[] => {
  if (status === undefined || status === null) return data
  return data.filter((item) => item[statusField] === status)
}

/**
 * Sorting utilities
 */

export const sortByField = <T extends Record<string, any>>(
  data: T[],
  field: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...data].sort((a, b) => {
    const aValue = a[field]
    const bValue = b[field]
    
    if (aValue === bValue) return 0
    if (aValue == null) return 1
    if (bValue == null) return -1
    
    const comparison = aValue > bValue ? 1 : -1
    return order === 'asc' ? comparison : -comparison
  })
}

export const sortByDate = <T extends Record<string, any>>(
  data: T[],
  dateField: keyof T,
  order: 'asc' | 'desc' = 'desc'
): T[] => {
  return [...data].sort((a, b) => {
    const aDate = dayjs(a[dateField] as any)
    const bDate = dayjs(b[dateField] as any)
    
    if (!aDate.isValid()) return 1
    if (!bDate.isValid()) return -1
    
    const comparison = aDate.isAfter(bDate) ? 1 : -1
    return order === 'asc' ? comparison : -comparison
  })
}

/**
 * Status mapping utilities
 */

export const getStatusColor = (status: string): string => {
  const statusMap: Record<string, string> = {
    active: 'green',
    inactive: 'red',
    pending: 'orange',
    approved: 'green',
    rejected: 'red',
    completed: 'blue',
    cancelled: 'gray',
    processing: 'blue',
    paid: 'green',
    unpaid: 'red',
  }
  
  return statusMap[status.toLowerCase()] || 'default'
}

export const getStatusLabel = (status: string): string => {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export const getRoleColor = (role: string): string => {
  const roleMap: Record<string, string> = {
    ROLE_ADMIN: 'red',
    ROLE_MANAGER: 'blue',
    ROLE_EMPLOYEE: 'green',
    admin: 'red',
    manager: 'blue',
    employee: 'green',
  }
  
  return roleMap[role] || 'default'
}

export const getRoleLabel = (role: string): string => {
  return role.replace('ROLE_', '').charAt(0).toUpperCase() + 
         role.replace('ROLE_', '').slice(1).toLowerCase()
}

/**
 * Pagination utilities
 */

export const paginate = <T>(
  data: T[],
  page: number,
  pageSize: number
): { data: T[]; total: number; page: number; pageSize: number } => {
  const start = (page - 1) * pageSize
  const end = start + pageSize
  
  return {
    data: data.slice(start, end),
    total: data.length,
    page,
    pageSize,
  }
}

/**
 * Data aggregation utilities
 */

export const groupBy = <T extends Record<string, any>>(
  data: T[],
  key: keyof T
): Record<string, T[]> => {
  return data.reduce((acc, item) => {
    const groupKey = String(item[key])
    if (!acc[groupKey]) {
      acc[groupKey] = []
    }
    acc[groupKey].push(item)
    return acc
  }, {} as Record<string, T[]>)
}

export const countBy = <T extends Record<string, any>>(
  data: T[],
  key: keyof T
): Record<string, number> => {
  return data.reduce((acc, item) => {
    const groupKey = String(item[key])
    acc[groupKey] = (acc[groupKey] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}

/**
 * URL query parameter utilities
 */

export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  })
  
  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

export const parseQueryString = (queryString: string): Record<string, string> => {
  const params = new URLSearchParams(queryString)
  const result: Record<string, string> = {}
  
  params.forEach((value, key) => {
    result[key] = value
  })
  
  return result
}

/**
 * Validation utilities
 */

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-()]+$/
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
}

/**
 * Number formatting utilities
 */

export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`
}

export const formatNumber = (value: number, decimals = 0): string => {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}
