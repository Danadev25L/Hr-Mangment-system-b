'use client'

import React from 'react'
import { Modal as AntModal, ModalProps as AntModalProps } from 'antd'
import { CloseOutlined } from '@ant-design/icons'

interface EnhancedModalProps extends AntModalProps {
  children: React.ReactNode
}

export const EnhancedModal: React.FC<EnhancedModalProps> = ({
  children,
  ...props
}) => {
  return (
    <>
      <AntModal
        {...props}
        closeIcon={<CloseOutlined className="text-gray-500 hover:text-gray-700" />}
        className="enhanced-modal"
      >
        {children}
      </AntModal>
      <style jsx global>{`
        .enhanced-modal .ant-modal-content {
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        .enhanced-modal .ant-modal-header {
          background: linear-gradient(135deg, rgb(59 130 246) 0%, rgb(147 51 234) 100%);
          border-bottom: none;
          padding: 24px 32px;
        }
        
        .enhanced-modal .ant-modal-title {
          color: white;
          font-size: 20px;
          font-weight: 600;
        }
        
        .enhanced-modal .ant-modal-close {
          top: 20px;
          right: 24px;
        }
        
        .enhanced-modal .ant-modal-close-x {
          width: 40px;
          height: 40px;
          line-height: 40px;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .enhanced-modal .ant-modal-close-x:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .enhanced-modal .ant-modal-body {
          padding: 32px;
        }
        
        .enhanced-modal .ant-modal-footer {
          border-top: 1px solid rgb(229 231 235);
          padding: 20px 32px;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        
        .dark .enhanced-modal .ant-modal-content {
          background: rgb(31 41 55);
          color: rgb(243 244 246);
        }
        
        .dark .enhanced-modal .ant-modal-footer {
          border-top-color: rgb(55 65 81);
        }
      `}</style>
    </>
  )
}
