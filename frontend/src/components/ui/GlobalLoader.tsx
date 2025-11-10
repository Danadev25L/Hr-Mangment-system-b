'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { CustomSpinner } from './CustomSpinner'

interface GlobalLoaderContextType {
  isLoading: boolean
  showLoader: (message?: string) => void
  hideLoader: () => void
  message: string
}

const GlobalLoaderContext = createContext<GlobalLoaderContextType | undefined>(undefined)

export const useGlobalLoader = () => {
  const context = useContext(GlobalLoaderContext)
  if (!context) {
    throw new Error('useGlobalLoader must be used within GlobalLoaderProvider')
  }
  return context
}

export const GlobalLoaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('Loading...')

  const showLoader = useCallback((msg: string = 'Loading...') => {
    setMessage(msg)
    setIsLoading(true)
  }, [])

  const hideLoader = useCallback(() => {
    setIsLoading(false)
  }, [])

  return (
    <GlobalLoaderContext.Provider value={{ isLoading, showLoader, hideLoader, message }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl">
            <CustomSpinner size="large" text={message} variant="logo" />
          </div>
        </div>
      )}
    </GlobalLoaderContext.Provider>
  )
}
