'use client';

import React, { useState } from 'react';
import { ConfigProvider } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useTheme } from '@/contexts/ThemeContext';
import { lightTheme, darkTheme } from './theme';

export default function RootProviderClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  
  // Create a client instance for React Query
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );
  
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={theme === 'dark' ? darkTheme : lightTheme}>
        {children}
      </ConfigProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
