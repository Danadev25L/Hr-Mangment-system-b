'use client'

import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProfilePage } from '@/components/profile/ProfilePage'

export default function EmployeeProfilePage() {
  const { user } = useAuth();
  
  return (
    <DashboardLayout role={user?.role || 'ROLE_EMPLOYEE'}>
      <ProfilePage role="ROLE_EMPLOYEE" />
    </DashboardLayout>
  );
}
