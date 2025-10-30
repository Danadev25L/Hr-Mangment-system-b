'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    console.log('🏠 Home page - Checking auth and redirecting...');
    
    // Check if user has token
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('✅ Found auth data, redirecting to dashboard for role:', user.role);
        
        // Redirect to appropriate dashboard
        switch (user.role) {
          case 'admin':
            router.replace('/admin');
            break;
          case 'manager':
            router.replace('/manager');
            break;
          case 'employee':
            router.replace('/employee');
            break;
          default:
            console.log('❓ Unknown role, redirecting to login');
            router.replace('/login');
        }
      } catch {
        console.log('❌ Invalid user data, redirecting to login');
        router.replace('/login');
      }
    } else {
      // No auth data - redirect to login
      console.log('🔒 No auth data found, redirecting to login');
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="flex justify-center items-center h-screen">
      <Spin size="large" tip="Redirecting..." />
    </div>
  );
}
