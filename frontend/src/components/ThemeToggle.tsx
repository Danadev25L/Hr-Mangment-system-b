'use client'

import React from 'react'
import { Button } from 'antd'
import { SunOutlined, MoonOutlined } from '@ant-design/icons'
import { useTheme } from '@/contexts/ThemeContext'

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md group"
    >
      {theme === 'light' ? (
        <>
          <MoonOutlined className="text-lg text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white hidden sm:inline">Dark</span>
        </>
      ) : (
        <>
          <SunOutlined className="text-lg text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform group-hover:rotate-45" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white hidden sm:inline">Light</span>
        </>
      )}
    </button>
  )
}

export default ThemeToggle