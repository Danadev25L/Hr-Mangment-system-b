'use client'

import React, { useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createLocalizedPath, getCurrentLocale } from '@/lib/localized-routes'
import { CustomSpinner } from '@/components/ui'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_EMPLOYEE'
  fallbackPath?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallbackPath = '/login',
}) => {
  const { isAuthenticated, isLoading, user, hasPermission } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const locale = getCurrentLocale(pathname)

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(createLocalizedPath(locale, fallbackPath))
        return
      }

      if (requiredRole && !hasPermission(requiredRole)) {
        // Redirect to appropriate dashboard based on user role
        switch (user?.role) {
          case 'ROLE_ADMIN':
            router.push(createLocalizedPath(locale, '/admin/dashboard'))
            break
          case 'ROLE_MANAGER':
            router.push(createLocalizedPath(locale, '/manager/dashboard'))
            break
          case 'ROLE_EMPLOYEE':
            router.push(createLocalizedPath(locale, '/employee/dashboard'))
            break
          default:
            router.push(createLocalizedPath(locale, '/login'))
        }
      }
    }
  }, [isAuthenticated, isLoading, requiredRole, user, hasPermission, router, fallbackPath])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CustomSpinner size="large" text="Loading..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (requiredRole && !hasPermission(requiredRole)) {
    return null
  }

  return <>{children}</>
}