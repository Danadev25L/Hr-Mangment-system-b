'use client'

import React from 'react'
import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd'
import { cn } from '@/lib/utils'

interface EnhancedButtonProps extends Omit<AntButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
  children: React.ReactNode
}

export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  variant = 'primary',
  className = '',
  children,
  ...props
}) => {
  const variantClasses = {
    primary: 'enhanced-btn-primary',
    secondary: 'enhanced-btn-secondary',
    danger: 'enhanced-btn-danger',
    success: 'enhanced-btn-success',
    ghost: 'enhanced-btn-ghost',
  }

  return (
    <>
      <AntButton
        {...props}
        className={cn('enhanced-btn', variantClasses[variant], className)}
      >
        {children}
      </AntButton>
      <style jsx global>{`
        .enhanced-btn {
          border-radius: 10px;
          font-weight: 500;
          padding: 0 20px;
          height: 40px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
          border: none;
        }
        
        .enhanced-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .enhanced-btn-primary {
          background: linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%);
          color: white;
        }
        
        .enhanced-btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, rgb(37 99 235) 0%, rgb(29 78 216) 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
        }
        
        .enhanced-btn-secondary {
          background: rgb(243 244 246);
          color: rgb(55 65 81);
        }
        
        .dark .enhanced-btn-secondary {
          background: rgb(55 65 81);
          color: rgb(243 244 246);
        }
        
        .enhanced-btn-secondary:hover:not(:disabled) {
          background: rgb(229 231 235);
          transform: translateY(-2px);
        }
        
        .dark .enhanced-btn-secondary:hover:not(:disabled) {
          background: rgb(75 85 99);
        }
        
        .enhanced-btn-danger {
          background: linear-gradient(135deg, rgb(239 68 68) 0%, rgb(220 38 38) 100%);
          color: white;
        }
        
        .enhanced-btn-danger:hover:not(:disabled) {
          background: linear-gradient(135deg, rgb(220 38 38) 0%, rgb(185 28 28) 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(239, 68, 68, 0.3);
        }
        
        .enhanced-btn-success {
          background: linear-gradient(135deg, rgb(34 197 94) 0%, rgb(22 163 74) 100%);
          color: white;
        }
        
        .enhanced-btn-success:hover:not(:disabled) {
          background: linear-gradient(135deg, rgb(22 163 74) 0%, rgb(21 128 61) 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(34, 197, 94, 0.3);
        }
        
        .enhanced-btn-ghost {
          background: transparent;
          border: 2px solid rgb(229 231 235);
          color: rgb(55 65 81);
        }
        
        .dark .enhanced-btn-ghost {
          border-color: rgb(55 65 81);
          color: rgb(243 244 246);
        }
        
        .enhanced-btn-ghost:hover:not(:disabled) {
          border-color: rgb(59 130 246);
          color: rgb(59 130 246);
          background: rgba(59, 130, 246, 0.05);
        }
      `}</style>
    </>
  )
}
