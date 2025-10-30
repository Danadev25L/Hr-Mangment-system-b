'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';

/**
 * Universal Auth Redirect Component
 * This component is used on ANY page that should redirect to login if not authenticated
 */
export default function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    console.log('🔒 Auth redirect triggered - checking authentication...');
    
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('🚨 No token found - redirecting to login');
      router.replace('/login');
    } else {
      console.log('✅ Token found - redirecting to home');
      router.replace('/');
    }
  }, [router]);

  return (
    <div className="flex justify-center items-center h-screen">
      <Spin size="large" tip="Checking authentication..." />
    </div>
  );
}