import AntdRegistry from '@/lib/antd-registry';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import RootProviderClient from '@/lib/root-provider-client';
import { AntdAppProvider } from '@/components/providers/AntdAppProvider';
import '@/styles/antd.css';

import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate that the incoming locale is valid
  const supportedLocales = ["en", "ku", "ar"];
  if (!supportedLocales.includes(locale)) {
    notFound();
  }

  // Load messages for the current locale
  const messages = await getMessages({ locale });

  // Set text direction based on locale (RTL for Arabic and Kurdish)
  const dir = locale === "en" ? "ltr" : "rtl";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-white dark:bg-gray-900">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <AntdRegistry>
            <ThemeProvider>
              <AuthProvider>
                <RootProviderClient>
                  <AntdAppProvider>
                    {children}
                  </AntdAppProvider>
                </RootProviderClient>
              </AuthProvider>
            </ThemeProvider>
          </AntdRegistry>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}