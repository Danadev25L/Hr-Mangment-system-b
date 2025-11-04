'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminManageSalaryPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/admin/salary/adjustments')
  }, [router])
  
  return null
}
