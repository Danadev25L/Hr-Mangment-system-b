import AntdRegistry from '@/lib/antd-registry';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import RootProviderClient from '@/lib/root-provider-client';
import '@/styles/globals.css';
import '@/styles/antd.css';

import { App } from 'antd';


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <ThemeProvider>
            <AuthProvider>
              <RootProviderClient>
                <App>{children}</App>
              </RootProviderClient>
            </AuthProvider>
          </ThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}