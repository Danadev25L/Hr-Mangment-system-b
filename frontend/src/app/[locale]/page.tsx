'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Spin } from 'antd'

export default function HomePage() {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      // Get current locale from pathname
      const locale = pathname.split('/')[1] || 'en'

      if (isAuthenticated) {
        // User is authenticated, redirect to appropriate dashboard
        // Try localStorage first, then cookie as fallback
        const getRole = () => {
          if (typeof window === 'undefined') return null
          return localStorage.getItem('userRole') || getCookie('userRole')
        }

        const getCookie = (name: string) => {
          if (typeof window === 'undefined') return null
          const value = `; ${document.cookie}`
          const parts = value.split(`; ${name}=`)
          if (parts.length === 2) {
            return parts.pop()?.split(';').shift() || null
          }
          return null
        }

        const userRole = getRole()
        switch (userRole) {
          case 'ROLE_ADMIN':
            router.replace(`/${locale}/admin/dashboard`)
            break
          case 'ROLE_MANAGER':
            router.replace(`/${locale}/manager/dashboard`)
            break
          case 'ROLE_EMPLOYEE':
            router.replace(`/${locale}/employee/dashboard`)
            break
          default:
            // If no role found, redirect to login to re-authenticate
            router.replace(`/${locale}/login`)
        }
      } else {
        // User is not authenticated, redirect to login
        router.replace(`/${locale}/login`)
      }
    }
  }, [isAuthenticated, isLoading, router, pathname])

  // Show loading spinner while checking authentication
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh'
    }}>
      <Spin size="large" />
    </div>
  )
}