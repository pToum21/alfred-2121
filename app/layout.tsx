// app/layout.tsx

import type { Metadata, Viewport } from 'next'
import { DM_Sans as FontSans, JetBrains_Mono as FontMono } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { ThemeProvider } from '@/components/theme-provider'
import Footer from '@/components/footer'
import { Toaster } from '@/components/ui/sonner'
import { AppStateProvider } from '@/lib/utils/app-state'
import { LayoutWrapper } from '@/components/layout-wrapper'
import { initializeDatabase } from '@/lib/db'
import { AuthProvider } from '@/lib/utils/auth-provider'
import { headers } from 'next/headers'
import { BackButton } from '@/components/ui/back-button'
import { Sidebar } from '@/components/sidebar'

const fontSans = FontSans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans'
})

const fontMono = FontMono({
  subsets: ['latin'],
  variable: '--font-mono'
})

const title = 'Chat ALFReD'
const description = 'Know Better. - AI Tools for Real Estate Professionals by Impact Capitol'

export const metadata: Metadata = {
  metadataBase: new URL('https://impactcapitol.com/'),
  title,
  description,
  openGraph: {
    title,
    description
  },
  twitter: {
    title,
    description,
    card: 'summary_large_image',
    creator: '@impactcapitol'
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersList = headers()
  const pathname = headersList.get('x-invoke-path') || ''
  const isAuthPage = pathname === '/login' || pathname === '/register'

  console.log(`[RootLayout] Current pathname: ${pathname}, isAuthPage: ${isAuthPage}`);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        'font-sans antialiased',
        fontSans.variable,
        fontMono.variable,
        isAuthPage ? 'auth-page' : ''
      )}>
        <ThemeProvider
          attribute="class"
          disableTransitionOnChange
        >
          <AuthProvider>
            <AppStateProvider>
              {isAuthPage ? (
                children
              ) : (
                <div className="flex h-screen overflow-hidden">
                  {/* Sidebar */}
                  <Sidebar />
                  
                  {/* Main content */}
                  <div id="main-content" className="flex-1 overflow-auto sidebar-layout sidebar-expanded">
                    <div className="flex flex-col min-h-screen">
                      <main className="flex-1 pb-24 pt-6 px-6">
                        {children}
                      </main>
                      <Footer />
                    </div>
                  </div>
                </div>
              )}
              <Toaster />
            </AppStateProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}