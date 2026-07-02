import type { Metadata, Viewport } from 'next'

import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Paytime - Time Tracking for Virtual Assistants',
  description: 'Simple time tracking app for global virtual assistants',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Paytime',
  },
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
