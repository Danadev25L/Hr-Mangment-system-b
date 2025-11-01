'use client'

import React, { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Spin } from 'antd'
import { useAuth } from '@/hooks/useAuth'

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

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(fallbackPath)
        return
      }

      if (requiredRole && !hasPermission(requiredRole)) {
        // Redirect to appropriate dashboard based on user role
        switch (user?.role) {
          case 'ROLE_ADMIN':
            router.push('/admin/dashboard')
            break
          case 'ROLE_MANAGER':
            router.push('/manager/dashboard')
            break
          case 'ROLE_EMPLOYEE':
            router.push('/employee/dashboard')
            break
          default:
            router.push('/login')
        }
      }
    }
  }, [isAuthenticated, isLoading, requiredRole, user, hasPermission, router, fallbackPath])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
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