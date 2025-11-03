'use client'

import { useRouter } from 'next/navigation'
import { Button, Result } from 'antd'
import { useTranslations } from 'next-intl'

export default function NotFound() {
  const router = useRouter()
  const t = useTranslations()

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '20px'
    }}>
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
        extra={
          <Button type="primary" onClick={() => router.push('/')}>
            Back Home
          </Button>
        }
      />
    </div>
  )
}
