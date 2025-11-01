'use client'

import React, { useEffect } from 'react'
import { App } from 'antd'
import { setMessageApi } from '@/lib/api'

interface MessageProviderProps {
  children: React.ReactNode
}

export const MessageProvider: React.FC<MessageProviderProps> = ({ children }) => {
  const { message } = App.useApp()

  useEffect(() => {
    setMessageApi(message)
  }, [message])

  return <>{children}</>
}