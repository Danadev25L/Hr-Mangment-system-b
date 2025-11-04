'use client'

import React from 'react'
import { Table, TableProps, Empty } from 'antd'
import { InboxOutlined } from '@ant-design/icons'

interface EnhancedTableProps extends TableProps<any> {
  className?: string
  variant?: 'default' | 'striped' | 'minimal'
}

export const EnhancedTable: React.FC<EnhancedTableProps> = ({ 
  className = '',
  variant = 'striped',
  ...props 
}) => {
  return (
    <div className={`enhanced-table-wrapper enhanced-table-${variant} ${className}`}>
      <Table
        {...props}
        className="enhanced-table"
        locale={{
          emptyText: (
            <Empty
              image={<InboxOutlined style={{ fontSize: 64, color: '#d1d5db' }} />}
              description={
                <div className="py-8">
                  <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    No data available
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Try adjusting your filters or search criteria
                  </p>
                </div>
              }
            />
          ),
        }}
        pagination={
          props.pagination !== false
            ? {
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
                ...props.pagination,
              }
            : false
        }
      />
      <style jsx global>{`
        .enhanced-table-wrapper {
          background: white;
          border-radius: 16px;
          padding: 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }
        
        .dark .enhanced-table-wrapper {
          background: rgb(31 41 55);
        }
        
        .enhanced-table .ant-table {
          background: transparent;
        }
        
        .enhanced-table .ant-table-thead > tr > th {
          background: linear-gradient(to bottom, rgb(249 250 251), rgb(243 244 246));
          color: rgb(55 65 81);
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border-bottom: 2px solid rgb(229 231 235);
          padding: 18px 20px;
          transition: all 0.3s ease;
        }
        
        .dark .enhanced-table .ant-table-thead > tr > th {
          background: linear-gradient(to bottom, rgb(17 24 39), rgb(31 41 55));
          color: rgb(209 213 219);
          border-bottom-color: rgb(55 65 81);
        }
        
        /* Striped variant */
        .enhanced-table-striped .ant-table-tbody > tr:nth-child(even) > td {
          background: rgb(249 250 251);
        }
        
        .dark .enhanced-table-striped .ant-table-tbody > tr:nth-child(even) > td {
          background: rgb(17 24 39);
        }
        
        .enhanced-table .ant-table-tbody > tr > td {
          padding: 18px 20px;
          font-size: 14px;
          color: rgb(55 65 81);
          border-bottom: 1px solid rgb(243 244 246);
          transition: all 0.2s ease;
        }
        
        .dark .enhanced-table .ant-table-tbody > tr > td {
          color: rgb(209 213 219);
          border-bottom-color: rgb(55 65 81);
        }
        
        .enhanced-table .ant-table-tbody > tr {
          transition: all 0.2s ease;
        }
        
        .enhanced-table .ant-table-tbody > tr:hover > td {
          background: rgb(239 246 255) !important;
          transform: scale(1.001);
        }
        
        .dark .enhanced-table .ant-table-tbody > tr:hover > td {
          background: rgb(30 58 138) !important;
        }
        
        .enhanced-table .ant-table-tbody > tr.ant-table-row-selected > td {
          background: rgb(219 234 254);
          border-left: 3px solid rgb(59 130 246);
        }
        
        .dark .enhanced-table .ant-table-tbody > tr.ant-table-row-selected > td {
          background: rgb(30 64 175);
        }
        
        /* Pagination */
        .enhanced-table .ant-pagination {
          margin-top: 24px;
          padding: 0 20px 20px;
        }
        
        .enhanced-table .ant-pagination-item {
          border-radius: 10px;
          border-color: rgb(229 231 235);
          transition: all 0.3s ease;
        }
        
        .enhanced-table .ant-pagination-item:hover {
          border-color: rgb(59 130 246);
          transform: translateY(-2px);
        }
        
        .enhanced-table .ant-pagination-item-active {
          background: linear-gradient(135deg, rgb(59 130 246), rgb(37 99 235));
          border-color: rgb(59 130 246);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        
        .enhanced-table .ant-pagination-item-active a {
          color: white;
        }
        
        /* Action buttons */
        .enhanced-table .ant-btn {
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .enhanced-table .ant-btn:hover {
          transform: translateY(-2px);
        }
        
        .enhanced-table .ant-pagination-item-active a {
          color: white;
        }
      `}</style>
    </div>
  )
}
