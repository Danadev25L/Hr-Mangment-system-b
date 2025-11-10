import React from 'react'

interface CustomSpinnerProps {
  size?: 'small' | 'default' | 'large'
  text?: string
  className?: string
  variant?: 'default' | 'logo' | 'pulse' | 'dots'
}

export const CustomSpinner: React.FC<CustomSpinnerProps> = ({ 
  size = 'default', 
  text,
  className = '',
  variant = 'logo'
}) => {
  const sizeClasses = {
    small: 'w-12 h-12',
    default: 'w-20 h-20',
    large: 'w-32 h-32'
  }

  const textSizes = {
    small: 'text-xs',
    default: 'text-sm',
    large: 'text-lg'
  }

  const logoSizes = {
    small: 'text-2xl',
    default: 'text-4xl',
    large: 'text-6xl'
  }

  if (variant === 'logo') {
    return (
      <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
        <div className={`relative ${sizeClasses[size]}`}>
          {/* Outer rotating ring with gradient */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm"></div>
          <div className="absolute inset-0 border-[3px] border-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-spin [clip-path:polygon(0%_0%,100%_0%,100%_50%,0%_50%)] [animation-duration:1.5s]"></div>
          
          {/* Inner pulsing ring */}
          <div className="absolute inset-2 border-[2px] border-indigo-300 dark:border-indigo-600 rounded-full animate-pulse"></div>
          
          {/* Logo in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`${logoSizes[size]} font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse`}>
              HR
            </div>
          </div>
        </div>
        {text && (
          <div className="text-center">
            <p className={`${textSizes[size]} text-gray-700 dark:text-gray-300 font-semibold animate-pulse`}>
              {text}
            </p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0ms]"></span>
              <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce [animation-delay:150ms]"></span>
              <span className="w-2 h-2 bg-pink-600 rounded-full animate-bounce [animation-delay:300ms]"></span>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
        <div className={`relative ${sizeClasses[size]}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-ping opacity-25"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full animate-pulse"></div>
        </div>
        {text && (
          <p className={`${textSizes[size]} text-gray-600 dark:text-gray-400 font-medium`}>
            {text}
          </p>
        )}
      </div>
    )
  }

  if (variant === 'dots') {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce [animation-delay:0ms]"></div>
          <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce [animation-delay:150ms]"></div>
          <div className="w-3 h-3 bg-pink-600 rounded-full animate-bounce [animation-delay:300ms]"></div>
        </div>
        {text && (
          <p className={`${textSizes[size]} text-gray-600 dark:text-gray-400 font-medium`}>
            {text}
          </p>
        )}
      </div>
    )
  }

  // Default variant
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-800 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
      </div>
      {text && (
        <p className={`${textSizes[size]} text-gray-600 dark:text-gray-400 font-medium`}>
          {text}
        </p>
      )}
    </div>
  )
}

// Ant Design compatible loading indicator
export const customLoadingIndicator = (text?: string, size: 'small' | 'default' | 'large' = 'default') => (
  <CustomSpinner text={text} size={size} variant="logo" />
)
