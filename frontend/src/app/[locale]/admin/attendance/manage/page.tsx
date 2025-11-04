'use client';

import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import ComprehensiveAttendancePage from '@/components/attendance/ComprehensiveAttendancePage';

export default function AdminAttendanceManagementPage() {
  const { user } = useAuth();
  
  return (
    <DashboardLayout role={user?.role || 'ROLE_ADMIN'}>
      <ComprehensiveAttendancePage role="ROLE_ADMIN" />
    </DashboardLayout>
  );
}
