'use client'

import React from 'react'
import { Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'

interface SearchInputProps {
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSearch?: (value: string) => void
  className?: string
  size?: 'small' | 'middle' | 'large'
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search...',
  value,
  onChange,
  onSearch,
  className = '',
  size = 'large',
}) => {
  return (
    <div className={`search-input-wrapper ${className}`}>
      <Input.Search
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onSearch={onSearch}
        size={size}
        prefix={<SearchOutlined className="text-gray-400" />}
        allowClear
        enterButton={
          <div className="flex items-center gap-2">
            <SearchOutlined />
            <span>Search</span>
          </div>
        }
        className="enhanced-search"
      />
      <style jsx global>{`
        .search-input-wrapper {
          width: 100%;
          max-width: 500px;
        }
        
        .enhanced-search {
          border-radius: 10px;
        }
        
        .enhanced-search .ant-input {
          border-radius: 10px 0 0 10px;
          border-right: none;
          font-size: 14px;
          padding: 12px 16px;
          background: rgb(249 250 251);
          border-color: rgb(229 231 235);
        }
        
        .dark .enhanced-search .ant-input {
          background: rgb(31 41 55);
          border-color: rgb(55 65 81);
          color: rgb(209 213 219);
        }
        
        .enhanced-search .ant-input:hover,
        .enhanced-search .ant-input:focus {
          border-color: rgb(59 130 246);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
        
        .enhanced-search .ant-input-group-addon {
          background: transparent;
          border: none;
        }
        
        .enhanced-search .ant-btn {
          border-radius: 0 10px 10px 0;
          height: 48px;
          padding: 0 24px;
          background: rgb(59 130 246);
          border-color: rgb(59 130 246);
          color: white;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        
        .enhanced-search .ant-btn:hover {
          background: rgb(37 99 235);
          border-color: rgb(37 99 235);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
      `}</style>
    </div>
  )
}
