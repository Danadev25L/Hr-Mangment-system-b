'use client'

import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AttendanceListPage } from '@/components/attendance/AttendanceListPage'

export default function AdminAttendancePage() {
  const { user } = useAuth();
  
  return (
    <DashboardLayout role={user?.role || 'ROLE_ADMIN'}>
      <AttendanceListPage role="ROLE_ADMIN" />
    </DashboardLayout>
  );
}
