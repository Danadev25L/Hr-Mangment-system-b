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

  // Check auth in background without blocking render
  useEffect(() => {
    // Only redirect if definitely not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push(createLocalizedPath(locale, fallbackPath))
      return
    }

    // Only check permissions after loading is complete
    if (!isLoading && requiredRole && !hasPermission(requiredRole)) {
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
  }, [isAuthenticated, isLoading, requiredRole, user, hasPermission, router, fallbackPath, locale, pathname])

  // OPTIMIZATION: Show content immediately - middleware already protected the route
  // This makes navigation instant while still checking auth in background
  return <>{children}</>
}