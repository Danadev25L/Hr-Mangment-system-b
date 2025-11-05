'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Button, Result } from 'antd'
import { useTranslations } from 'next-intl'
import { createLocalizedPath, getCurrentLocale } from '@/lib/localized-routes'

export default function NotFound() {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations()
  const locale = getCurrentLocale(pathname)

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
          <Button type="primary" onClick={() => router.push(createLocalizedPath(locale, '/'))}>
            Back Home
          </Button>
        }
      />
    </div>
  )
}
