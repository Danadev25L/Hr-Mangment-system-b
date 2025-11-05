'use client'

import React from 'react'
import { Card as AntCard, CardProps } from 'antd'
import { cn } from '@/lib/utils'

interface EnhancedCardProps extends CardProps {
  children: React.ReactNode
  className?: string
  hoverable?: boolean
  noPadding?: boolean
}

export const EnhancedCard: React.FC<EnhancedCardProps> = ({
  children,
  className = '',
  hoverable = false,
  noPadding = false,
  ...props
}) => {
  return (
    <AntCard
      {...props}
      className={cn(
        'enhanced-card',
        hoverable && 'enhanced-card-hoverable',
        noPadding && 'enhanced-card-no-padding',
        className
      )}
      variant="borderless"
    >
      {children}
      <style jsx global>{`
        .enhanced-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }
        
        .dark .enhanced-card {
          background: rgb(31 41 55);
        }
        
        .enhanced-card .ant-card-body {
          padding: 24px;
        }
        
        .enhanced-card-no-padding .ant-card-body {
          padding: 0;
        }
        
        .enhanced-card-hoverable:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        
        .enhanced-card .ant-card-head {
          border-bottom: 1px solid rgb(243 244 246);
          padding: 20px 24px;
          font-weight: 600;
          font-size: 16px;
          color: rgb(17 24 39);
        }
        
        .dark .enhanced-card .ant-card-head {
          border-bottom-color: rgb(55 65 81);
          color: rgb(243 244 246);
        }
      `}</style>
    </AntCard>
  )
}
