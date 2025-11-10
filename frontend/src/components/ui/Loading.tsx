import React from 'react'
import { cn } from '@/lib/utils'
import { CustomSpinner } from './CustomSpinner'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
  variant?: 'default' | 'logo' | 'pulse' | 'dots'
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  text,
  className,
  variant = 'logo',
}) => {
  const getSize = () => {
    switch (size) {
      case 'sm':
        return 'small'
      case 'lg':
        return 'large'
      default:
        return 'default'
    }
  }

  return (
    <div className={cn('flex flex-col items-center justify-center p-8', className)}>
      <CustomSpinner size={getSize() as 'small' | 'default' | 'large'} text={text} variant={variant} />
    </div>
  )
}

export const PageLoading: React.FC<{ text?: string; variant?: 'default' | 'logo' | 'pulse' | 'dots' }> = ({ 
  text = 'Loading...', 
  variant = 'logo' 
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
    <CustomSpinner size="large" text={text} variant={variant} />
  </div>
)

export const TableLoading: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, index) => (
      <div
        key={index}
        className="h-16 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-lg animate-pulse"
      />
    ))}
  </div>
)

export const InlineLoading: React.FC<{ text?: string }> = ({ text }) => (
  <div className="flex items-center justify-center py-4">
    <CustomSpinner size="small" text={text} variant="dots" />
  </div>
)

export const FullPageLoading: React.FC<{ text?: string }> = ({ text = 'Loading your data...' }) => (
  <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
    <CustomSpinner size="large" text={text} variant="logo" />
  </div>
)