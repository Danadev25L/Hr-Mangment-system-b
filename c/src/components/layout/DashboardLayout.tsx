'use client';

import React, { useState } from 'react';
import { Layout } from 'antd';
import { Sidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';

const { Content } = Layout;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} />
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        <DashboardHeader collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            background: '#fff',
            minHeight: 280,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};
