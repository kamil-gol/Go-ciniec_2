'use client'

import { BarChart3 } from 'lucide-react'
import { PageLayout, PageHero, EmptyState } from '@/components/shared'
import { moduleAccents } from '@/lib/design-tokens'

export default function ReportsPage() {
  const accent = moduleAccents.reports

  return (
    <PageLayout>
      <PageHero
        accent={accent}
        title="Raporty"
        subtitle="Analizy, statystyki i raporty biznesowe"
        icon={BarChart3}
      />

      <div className="rounded-2xl bg-white dark:bg-neutral-800/80 p-8 shadow-soft border border-neutral-100 dark:border-neutral-700/50">
        <EmptyState
          icon={BarChart3}
          title="Moduł Raportów"
          description="Zaawansowany system raportowania w przygotowaniu — przychody i wydatki, statystyki rezerwacji, zajętość sal, export do Excel/PDF."
        />
        <div className="flex justify-center mt-4">
          <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${accent.badge} ${accent.badgeText}`}>
            ✨ Nowy moduł — Sprint 5
          </span>
        </div>
      </div>
    </PageLayout>
  )
}
