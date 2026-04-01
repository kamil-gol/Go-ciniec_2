'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token')

    if (token) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [router])

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent" />
        <p className="mt-4 text-muted-foreground">Przekierowywanie...</p>
      </div>
    </div>
  )
}
