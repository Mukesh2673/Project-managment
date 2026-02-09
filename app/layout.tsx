import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'

export const metadata: Metadata = {
  title: {
    default: 'Project Management Tool',
    template: '%s | Project Management',
  },
  description: 'Manage your projects and tickets efficiently with a modern Kanban board interface',
  keywords: ['project management', 'kanban', 'tickets', 'task management', 'team collaboration'],
  authors: [{ name: 'Project Management Team' }],
  creator: 'Project Management Tool',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Project Management Tool',
    description: 'Manage your projects and tickets efficiently',
    siteName: 'Project Management Tool',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Project Management Tool',
    description: 'Manage your projects and tickets efficiently',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0f172a' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
