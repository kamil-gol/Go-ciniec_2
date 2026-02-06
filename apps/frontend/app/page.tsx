import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-100">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-5xl font-bold text-secondary-900 mb-4">
          System Rezerwacji Sal
        </h1>
        <h2 className="text-2xl text-secondary-700 mb-8">
          Gościniec Rodzinny
        </h2>
        <p className="text-lg text-secondary-600 mb-12 max-w-2xl mx-auto">
          Profesjonalny system zarządzania rezerwacjami sal weselnych i okolicznościowych
          z pełną integracją administracyjną, statystykami i automatyzacją procesów biznesowych.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" className="text-lg px-8">
              Zaloguj się
            </Button>
          </Link>
          <Link href="/reservations">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Pokaż rezerwacje
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
