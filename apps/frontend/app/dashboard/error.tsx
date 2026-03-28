'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 animate-slide-up">
      <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-destructive/10 mb-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Coś poszło nie tak
      </h2>
      <p className="text-muted-foreground mb-6 text-center max-w-md text-sm">
        Wystąpił nieoczekiwany błąd. Spróbuj odświeżyć stronę lub skontaktuj się z administratorem.
      </p>
      <Button onClick={reset} className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Spróbuj ponownie
      </Button>
    </div>
  )
}
