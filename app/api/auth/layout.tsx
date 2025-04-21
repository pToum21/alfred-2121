import React from 'react';
import { AuthPageLayout } from '@/components/auth-page-layout';
import { ThemeProvider } from '@/components/theme-provider';

export default function AuthLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="overflow-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthPageLayout>
            {children}
          </AuthPageLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}