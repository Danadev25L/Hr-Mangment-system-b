import React from 'react'
import { cn } from '@/lib/utils'
import { CustomSpinner } from './CustomSpinner'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  text,
  className,
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
      <CustomSpinner size={getSize() as 'small' | 'default' | 'large'} text={text} />
    </div>
  )
}

export const PageLoading: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center">
    <CustomSpinner size="large" text={text} />
  </div>
)

export const TableLoading: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, index) => (
      <div
        key={index}
        className="h-16 bg-gray-100 rounded-lg loading-shimmer"
      />
    ))}
  </div>
)