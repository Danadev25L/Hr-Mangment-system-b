'use client';

import { useTheme } from '@/contexts/ThemeContext';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import React, { useState } from 'react';

import { ConfigProvider } from 'antd';

import { lightTheme, darkTheme } from './theme';

export default function RootProviderClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  
  // Create a client instance for React Query with aggressive caching - OPTIMIZED
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60 * 1000, // 2 minutes - balance between freshness and speed
            gcTime: 10 * 60 * 1000, // 10 minutes - keep in memory
            refetchOnWindowFocus: false,
            refetchOnMount: 'always', // Always fetch on mount for immediate data display
            refetchOnReconnect: false,
            retry: 1, // Only retry once to avoid delays
            retryDelay: 300, // Fast retry (300ms)
            // Use cache while fetching fresh data
            placeholderData: (previousData: any) => previousData,
            // Network mode for better offline handling
            networkMode: 'online',
          },
          mutations: {
            retry: 0, // Don't retry mutations to avoid delays on errors
            networkMode: 'online',
          },
        },
      })
  );
  
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={theme === 'dark' ? darkTheme : lightTheme}>
        {children}
      </ConfigProvider>
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
