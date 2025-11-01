import React from 'react'
import { Spin, SpinProps } from 'antd'
import { cn } from '@/lib/utils'

interface LoadingProps extends SpinProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  text,
  className,
  ...props
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
      <Spin size={getSize()} {...props} />
      {text && <p className="mt-4 text-gray-500 text-sm">{text}</p>}
    </div>
  )
}

export const PageLoading: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center">
    <Loading size="lg" text={text} />
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