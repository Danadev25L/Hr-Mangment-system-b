'use client'

import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProfilePage } from '@/components/profile/ProfilePage'

export default function ManagerProfilePage() {
  const { user } = useAuth();
  
  return (
    <DashboardLayout role={user?.role || 'ROLE_MANAGER'}>
      <ProfilePage role="ROLE_MANAGER" />
    </DashboardLayout>
  );
}
