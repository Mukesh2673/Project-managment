import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Project Management Tool',
  description: 'Manage your projects and tickets efficiently',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
