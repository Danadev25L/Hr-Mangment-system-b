'use client'

import React from 'react'
import { getInitials } from '@/lib/utils'

interface AvatarWithInitialsProps {
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  variant?: 'gradient' | 'solid'
}

export const AvatarWithInitials: React.FC<AvatarWithInitialsProps> = ({
  name,
  size = 'md',
  className = '',
  variant = 'gradient',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  }

  const gradients = [
    'from-blue-500 to-purple-600',
    'from-green-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-blue-600',
    'from-yellow-500 to-orange-600',
    'from-cyan-500 to-blue-600',
    'from-purple-500 to-pink-600',
  ]

  const solidColors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-yellow-500',
    'bg-cyan-500',
    'bg-purple-500',
  ]

  // Generate consistent color based on name
  const getColorIndex = (str: string) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    return Math.abs(hash) % (variant === 'gradient' ? gradients.length : solidColors.length)
  }

  const colorIndex = getColorIndex(name)
  const colorClass = variant === 'gradient' 
    ? `bg-gradient-to-br ${gradients[colorIndex]}`
    : solidColors[colorIndex]

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${colorClass}
        ${className}
        rounded-full
        flex items-center justify-center
        text-white font-bold
        shadow-md
        transition-transform hover:scale-105
      `}
    >
      {getInitials(name)}
    </div>
  )
}
