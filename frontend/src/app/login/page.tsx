'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { LoginForm } from '@/components/auth/LoginForm'
import { Spin } from 'antd'

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // User is already authenticated, redirect to appropriate dashboard
      // Try localStorage first, then cookie as fallback
      const getRole = () => {
        if (typeof window !== 'undefined') {
          return localStorage.getItem('userRole') || getCookie('userRole')
        }
        return null
      }

      const getCookie = (name: string) => {
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
          router.replace('/admin/dashboard')
          break
        case 'ROLE_MANAGER':
          router.replace('/manager/dashboard')
          break
        case 'ROLE_EMPLOYEE':
          router.replace('/employee/dashboard')
          break
        default:
          router.replace('/employee/dashboard')
      }
    }
  }, [isAuthenticated, isLoading, router])

  // Show loading spinner while checking authentication
  if (isLoading) {
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

  // If not authenticated, show login form
  return <LoginForm />
}