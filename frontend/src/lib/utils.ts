import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2)
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function getRoleColor(role: string): string {
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

export function getRoleLabel(role: string): string {
  return role.replace('ROLE_', '').charAt(0).toUpperCase() + 
         role.replace('ROLE_', '').slice(1).toLowerCase()
}

export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'green',
    inactive: 'red',
    pending: 'orange',
    approved: 'green',
    rejected: 'red',
    completed: 'blue',
    cancelled: 'gray',
  }
  return statusMap[status.toLowerCase()] || 'default'
}