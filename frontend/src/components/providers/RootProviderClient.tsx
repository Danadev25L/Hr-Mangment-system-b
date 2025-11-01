'use client'

import React from 'react'
import { App } from 'antd'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ThemeConfigProvider } from './ThemeConfigProvider'
import { QueryProvider } from './QueryProvider'
import { MessageProvider } from './MessageProvider'

interface RootProviderClientProps {
  children: React.ReactNode
}

export const RootProviderClient: React.FC<RootProviderClientProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <ThemeConfigProvider>
        <MessageProvider>
          <QueryProvider>
            <App>
              {children}
            </App>
          </QueryProvider>
        </MessageProvider>
      </ThemeConfigProvider>
    </ThemeProvider>
  )
}

export default RootProviderClient