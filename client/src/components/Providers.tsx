'use client';

import '@ant-design/v5-patch-for-react-19';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ConfigProvider, App } from 'antd';
import AntdRegistry from './AntdRegistry';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AntdRegistry>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#1890ff',
              borderRadius: 6,
            },
            cssVar: true,
            hashed: false,
          }}
          // Add React 19 compatibility
          componentSize="middle"
          form={{
            validateMessages: {
              required: '${label} is required!',
            },
          }}
        >
          <App
            // Configure App component for better React 19 compatibility
            message={{
              maxCount: 3,
              duration: 3,
            }}
            notification={{
              maxCount: 5,
              placement: 'topRight',
            }}
          >
            {children}
          </App>
        </ConfigProvider>
      </AntdRegistry>
    </QueryClientProvider>
  );
}
