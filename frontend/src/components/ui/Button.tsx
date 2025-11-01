import React from 'react'
import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd'
import { cn } from '@/lib/utils'

interface ButtonProps extends AntButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary-600 hover:bg-primary-700 border-primary-600 text-white'
      case 'secondary':
        return 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700'
      case 'outline':
        return 'bg-transparent hover:bg-gray-50 border-gray-300 text-gray-700'
      case 'ghost':
        return 'bg-transparent hover:bg-gray-100 border-transparent text-gray-700'
      case 'link':
        return 'bg-transparent border-transparent text-primary-600 hover:text-primary-700 p-0 h-auto'
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 border-red-600 text-white'
      default:
        return ''
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-3 py-1 h-8'
      case 'md':
        return 'text-sm px-4 py-2 h-10'
      case 'lg':
        return 'text-base px-6 py-3 h-12'
      default:
        return ''
    }
  }

  return (
    <AntButton
      className={cn(
        'transition-all duration-200 font-medium rounded-md',
        getVariantClasses(),
        getSizeClasses(),
        className
      )}
      {...props}
    >
      {children}
    </AntButton>
  )
}