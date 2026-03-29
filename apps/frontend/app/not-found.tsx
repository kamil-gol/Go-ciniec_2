import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-neutral-900 dark:text-neutral-100">404</h1>
        <p className="mt-4 text-xl text-neutral-600 dark:text-neutral-400">Strona nie została znaleziona</p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/dashboard">
            Wróć do panelu
          </Link>
        </Button>
      </div>
    </div>
  )
}
