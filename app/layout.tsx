import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Sidebar } from '@/components/layout/Sidebar'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ThemeProvider } from '@/components/theme-provider'
import { CommandPalette } from '@/components/search/CommandPalette'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Claude Code Manager',
  description: 'Manage Claude Code configurations, skills, and plugins',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary>
            <div className="flex h-screen">
              <Sidebar />
              <main className="flex-1 overflow-auto pt-16 lg:pt-0">{children}</main>
            </div>
            <CommandPalette />
            <Toaster position="top-right" closeButton />
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
