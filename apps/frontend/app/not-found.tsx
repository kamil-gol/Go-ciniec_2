import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-neutral-900">404</h1>
        <p className="mt-4 text-xl text-neutral-600">Strona nie została znaleziona</p>
        <Link
          href="/dashboard"
          className="mt-8 inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Wróć do panelu
        </Link>
      </div>
    </div>
  )
}
