'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ManagerManageSalaryPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/manager/salary/adjustments')
  }, [router])
  
  return null
}
