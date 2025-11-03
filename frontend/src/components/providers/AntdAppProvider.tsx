'use client'

import React from 'react'
import { App } from 'antd'

interface AntdAppProviderProps {
  children: React.ReactNode
}

export const AntdAppProvider: React.FC<AntdAppProviderProps> = ({ children }) => {
  return <App>{children}</App>
}
