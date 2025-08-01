import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DiscoBuddy',
  description: 'Discovery Health AI Assistant - Your health and wellness companion',
  generator: 'The Real Gerald)',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover" />
      </head>
      <body>{children}</body>
    </html>
  )
}
