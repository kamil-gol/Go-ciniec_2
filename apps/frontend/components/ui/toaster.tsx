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
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
        },
        className: 'backdrop-blur-sm z-[99999] text-sm',
      }}
    />
  )
}
