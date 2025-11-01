import React from 'react'
import { Card as AntCard, CardProps as AntCardProps } from 'antd'
import { cn } from '@/lib/utils'

interface CardProps extends AntCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hover = false,
  ...props
}) => {
  return (
    <AntCard
      className={cn(
        'shadow-sm border border-gray-200',
        hover && 'transition-all duration-200 hover:shadow-lg hover:-translate-y-1',
        className
      )}
      {...props}
    >
      {children}
    </AntCard>
  )
}

export const CardHeader: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => (
  <div className={cn('pb-4 border-b border-gray-200 mb-4', className)}>
    {children}
  </div>
)

export const CardContent: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => (
  <div className={cn('', className)}>
    {children}
  </div>
)

export const CardFooter: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => (
  <div className={cn('pt-4 border-t border-gray-200 mt-4', className)}>
    {children}
  </div>
)