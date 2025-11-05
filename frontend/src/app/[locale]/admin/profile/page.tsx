'use client'

import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProfilePage } from '@/components/profile/ProfilePage'

export default function AdminProfilePage() {
  const { user } = useAuth();
  
  return (
    <DashboardLayout role={user?.role || 'ROLE_ADMIN'}>
      <ProfilePage role="ROLE_ADMIN" />
    </DashboardLayout>
  );
}
