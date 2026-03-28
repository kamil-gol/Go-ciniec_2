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
        className: 'backdrop-blur-sm z-[99999] text-sm p-4 rounded-xl shadow-hard',
      }}
    />
  )
}
