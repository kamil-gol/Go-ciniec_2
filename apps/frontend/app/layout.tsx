import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'

const inter = localFont({
  src: '../public/fonts/Inter-Variable.woff2',
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'System Rezerwacji - Gościniec Rodzinny',
  description: 'Profesjonalny system zarządzania rezerwacjami sal dla restauracji Gościniec Rodzinny',
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={inter.className}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
        >
          Przejdź do treści
        </a>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
