import { useAuth as useAuthContext } from '@/contexts/AuthContext'
import { UserRole } from '@/types'

export const useAuth = () => {
  const auth = useAuthContext()

  const isAdmin = auth.user?.role === 'ROLE_ADMIN'
  const isManager = auth.user?.role === 'ROLE_MANAGER'
  const isEmployee = auth.user?.role === 'ROLE_EMPLOYEE'

  const hasPermission = (requiredRole: UserRole) => {
    if (!auth.user) return false

    const roleHierarchy = {
      ROLE_ADMIN: 3,
      ROLE_MANAGER: 2,
      ROLE_EMPLOYEE: 1,
    }

    return roleHierarchy[auth.user.role] >= roleHierarchy[requiredRole]
  }

  const canAccessResource = (resource: string, action: 'create' | 'read' | 'update' | 'delete') => {
    // Define permission matrix
    const permissions: Record<string, Record<UserRole, string[]>> = {
      users: {
        ROLE_ADMIN: ['create', 'read', 'update', 'delete'],
        ROLE_MANAGER: ['read'],
        ROLE_EMPLOYEE: ['read'],
      },
      departments: {
        ROLE_ADMIN: ['create', 'read', 'update', 'delete'],
        ROLE_MANAGER: ['read'],
        ROLE_EMPLOYEE: ['read'],
      },
      announcements: {
        ROLE_ADMIN: ['create', 'read', 'update', 'delete'],
        ROLE_MANAGER: ['create', 'read', 'update'],
        ROLE_EMPLOYEE: ['read'],
      },
      applications: {
        ROLE_ADMIN: ['create', 'read', 'update', 'delete'],
        ROLE_MANAGER: ['create', 'read', 'update'],
        ROLE_EMPLOYEE: ['create', 'read'],
      },
      expenses: {
        ROLE_ADMIN: ['create', 'read', 'update', 'delete'],
        ROLE_MANAGER: ['create', 'read', 'update'],
        ROLE_EMPLOYEE: ['create', 'read'],
      },
      holidays: {
        ROLE_ADMIN: ['create', 'read', 'update', 'delete'],
        ROLE_MANAGER: ['read'],
        ROLE_EMPLOYEE: ['read'],
      },
      analytics: {
        ROLE_ADMIN: ['read'],
        ROLE_MANAGER: ['read'],
        ROLE_EMPLOYEE: [],
      },
      payroll: {
        ROLE_ADMIN: ['read', 'update'],
        ROLE_MANAGER: ['read'],
        ROLE_EMPLOYEE: ['read'],
      },
    }

    return permissions[resource]?.[auth.user?.role || 'ROLE_EMPLOYEE']?.includes(action) || false
  }

  return {
    ...auth,
    isAdmin,
    isManager,
    isEmployee,
    hasPermission,
    canAccessResource,
  }
}