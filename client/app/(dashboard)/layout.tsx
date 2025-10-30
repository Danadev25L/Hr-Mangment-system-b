'use client';

import { DashboardLayout } from '@/src/components/layout/DashboardLayout';
import { useAuthGuard } from '@/src/middleware/auth';
import { Spin } from 'antd';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthGuard();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <Spin size="large" />
        <p className="text-gray-600">Checking authentication...</p>
      </div>
    );
  }

  // Only render dashboard if authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <Spin size="large" />
        <p className="text-gray-600">Redirecting...</p>
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
