'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to login page
    router.push('/login')
  }, [router])

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:from-neutral-900 dark:to-neutral-800">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-violet-600 border-r-transparent" />
        <p className="mt-4 text-neutral-600 dark:text-neutral-400">Przekierowywanie...</p>
      </div>
    </div>
  )
}
