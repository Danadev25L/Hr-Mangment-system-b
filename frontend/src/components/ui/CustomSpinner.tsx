import React from 'react'

interface CustomSpinnerProps {
  size?: 'small' | 'default' | 'large'
  text?: string
  className?: string
}

export const CustomSpinner: React.FC<CustomSpinnerProps> = ({ 
  size = 'default', 
  text,
  className = '' 
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    default: 'w-16 h-16',
    large: 'w-24 h-24'
  }

  const textSizes = {
    small: 'text-xs',
    default: 'text-sm',
    large: 'text-base'
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
      {text && (
        <p className={`${textSizes[size]} text-gray-600 font-medium`}>
          {text}
        </p>
      )}
    </div>
  )
}

// Ant Design compatible loading indicator
export const customLoadingIndicator = (text?: string, size: 'small' | 'default' | 'large' = 'default') => (
  <CustomSpinner text={text} size={size} />
)
