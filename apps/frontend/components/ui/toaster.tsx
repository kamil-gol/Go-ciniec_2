'use client'

import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      richColors
      expand={true}
      visibleToasts={5}
      gap={8}
      offset={16}
      closeButton
      duration={4000}
      toastOptions={{
        style: {
          padding: '16px',
          borderRadius: '12px',
          fontSize: '14px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
          zIndex: 99999,
        },
        className: 'backdrop-blur-sm',
      }}
    />
  )
}
