'use client'

import React from 'react'
import { Skeleton } from 'antd'

interface SkeletonLoaderProps {
  variant?: 'text' | 'card' | 'list' | 'table' | 'profile' | 'dashboard' | 'form'
  rows?: number
  avatar?: boolean
  className?: string
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  rows = 3,
  avatar = false,
  className = ''
}) => {
  if (variant === 'text') {
    return (
      <div className={`space-y-3 ${className}`}>
        <Skeleton active paragraph={{ rows }} />
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm ${className}`}>
        <Skeleton active avatar={avatar} paragraph={{ rows: 4 }} />
      </div>
    )
  }

  if (variant === 'list') {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
          >
            <Skeleton active avatar paragraph={{ rows: 2 }} />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'table') {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm ${className}`}>
        <div className="space-y-4">
          {/* Table header */}
          <div className="flex gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          
          {/* Table rows */}
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="flex gap-4 items-center">
              <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="w-20 h-6 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'profile') {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm ${className}`}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
            <div className="h-4 bg-gray-100 dark:bg-gray-600 rounded w-1/3 animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-5/6 animate-pulse"></div>
          <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-4/6 animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (variant === 'dashboard') {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                <div className="w-16 h-4 bg-gray-100 dark:bg-gray-600 rounded animate-pulse"></div>
              </div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-2/3 animate-pulse"></div>
            </div>
          ))}
        </div>
        
        {/* Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse mb-6"></div>
          <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (variant === 'form') {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-6 ${className}`}>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
            <div className="h-10 bg-gray-100 dark:bg-gray-600 rounded animate-pulse"></div>
          </div>
        ))}
        <div className="flex gap-3 pt-4">
          <div className="h-10 bg-indigo-200 dark:bg-indigo-700 rounded w-24 animate-pulse"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
        </div>
      </div>
    )
  }

  return <Skeleton active />
}

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <SkeletonLoader variant="table" rows={rows} />
)

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonLoader key={index} variant="card" />
    ))}
  </div>
)

export const DashboardSkeleton: React.FC = () => (
  <SkeletonLoader variant="dashboard" />
)

export const ProfileSkeleton: React.FC = () => (
  <SkeletonLoader variant="profile" />
)

export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 5 }) => (
  <SkeletonLoader variant="form" rows={fields} />
)
