'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

const pathLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  reservations: 'Rezerwacje',
  clients: 'Klienci',
  halls: 'Sale',
  menu: 'Menu',
  queue: 'Kolejka',
  deposits: 'Zaliczki',
  'event-types': 'Typy Wydarzeń',
  reports: 'Raporty',
  settings: 'Ustawienia',
  dishes: 'Dania',
  categories: 'Kategorie',
  options: 'Opcje',
  templates: 'Szablony',
  packages: 'Pakiety',
  new: 'Nowy',
  edit: 'Edycja',
  catering: 'Catering',
  orders: 'Zamówienia',
  archive: 'Archiwum',
  'audit-log': 'Dziennik Audytu',
  'daily-view': 'Widok Dzienny',
  'document-templates': 'Szablony Dokumentów',
  notifications: 'Powiadomienia',
  'service-extras': 'Usługi Dodatkowe',
  courses: 'Dania',
  calendar: 'Kalendarz',
  list: 'Lista',
}

export function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length <= 1) return null

  const crumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    const label = pathLabels[segment] || segment
    const isLast = index === segments.length - 1

    return { href, label, isLast, segment }
  })

  return (
    <nav className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-300 mb-2">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 hover:text-primary dark:hover:text-primary transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {crumbs.slice(1).map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3 text-neutral-300 dark:text-neutral-400" />
          {crumb.isLast ? (
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="hover:text-primary dark:hover:text-primary transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
