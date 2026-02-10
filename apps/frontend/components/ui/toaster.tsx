'use client'

import { Toaster as Sonner } from 'sonner'
import { useTheme } from 'next-themes'

export function Toaster() {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme as 'light' | 'dark' | 'system'}
      position="top-right"
      richColors
      expand={true}
      duration={4000}
      toastOptions={{
        style: {
          padding: '16px',
          borderRadius: '12px',
          fontSize: '14px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
        },
        className: 'backdrop-blur-sm',
      }}
    />
  )
}
