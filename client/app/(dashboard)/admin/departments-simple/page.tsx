'use client';

import { useAuthGuard } from '@/src/middleware/auth';

export default function AdminDepartmentsPageSimple() {
  const { isAuthenticated, loading } = useAuthGuard('admin');

  if (loading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div className="flex justify-center items-center h-96">Not authenticated</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🏢 Departments Management</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-lg">✅ Department page is working!</p>
        <p className="text-gray-600 mt-2">This is the admin departments page.</p>
        <p className="text-sm text-gray-500 mt-4">Path: /dashboard/admin/departments</p>
      </div>
    </div>
  );
}