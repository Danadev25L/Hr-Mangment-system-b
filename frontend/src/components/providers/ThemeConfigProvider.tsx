'use client'

import React from 'react'
import { ConfigProvider } from 'antd'
import { lightTheme, darkTheme } from '@/lib/theme'
import { useTheme } from '@/contexts/ThemeContext'

interface ThemeConfigProviderProps {
  children: React.ReactNode
}

export const ThemeConfigProvider: React.FC<ThemeConfigProviderProps> = ({ children }) => {
  const { theme } = useTheme()

  return (
    <ConfigProvider theme={theme === 'dark' ? darkTheme : lightTheme}>
      {children}
    </ConfigProvider>
  )
}

export default ThemeConfigProvider