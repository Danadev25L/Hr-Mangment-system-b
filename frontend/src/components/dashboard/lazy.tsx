import React, { Suspense } from 'react'
import { Spin } from 'antd'
import dynamic from 'next/dynamic'

// Loading component
const DashboardLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <Spin size="large" />
      <p className="mt-4 text-gray-500">Loading dashboard...</p>
    </div>
  </div>
)

// Lazy loaded dashboard components
export const AdminDashboard = dynamic(
  () => import('./AdminDashboard'),
  { loading: DashboardLoadingFallback }
)

export const ManagerDashboard = dynamic(
  () => import('./ManagerDashboard'),
  { loading: DashboardLoadingFallback }
)

export const EmployeeDashboard = dynamic(
  () => import('./EmployeeDashboard'),
  { loading: DashboardLoadingFallback }
)