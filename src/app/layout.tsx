import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { SearchProvider } from '@/contexts/SearchContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { KeyboardShortcutProvider } from '@/contexts/KeyboardShortcutContext'
import { OfflineProvider } from '@/contexts/OfflineContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Todo List App',
  description: 'A modern todo list application built with Next.js and Supabase',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TodoApp'
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ]
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <KeyboardShortcutProvider>
            <AuthProvider>
              <OfflineProvider>
                <SearchProvider>
                  {children}
                </SearchProvider>
              </OfflineProvider>
            </AuthProvider>
          </KeyboardShortcutProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}