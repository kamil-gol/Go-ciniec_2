'use client'

import { Settings } from 'lucide-react'
import { PageLayout, PageHero, EmptyState } from '@/components/shared'
import { moduleAccents } from '@/lib/design-tokens'

export default function SettingsPage() {
  const accent = moduleAccents.settings

  return (
    <PageLayout>
      <PageHero
        accent={accent}
        title="Ustawienia"
        subtitle="Konfiguracja systemu i preferencje"
        icon={Settings}
      />

      <div className="rounded-2xl bg-white dark:bg-neutral-800/80 p-8 shadow-soft border border-neutral-100 dark:border-neutral-700/50">
        <EmptyState
          icon={Settings}
          title="Moduł Ustawień"
          description="Panel ustawień w przygotowaniu — dane firmy, użytkownicy i uprawnienia, powiadomienia email/SMS, integracje zewnętrzne."
        />
        <div className="flex justify-center mt-4">
          <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${accent.badge} ${accent.badgeText}`}>
            ✨ Nowy moduł — Sprint 6
          </span>
        </div>
      </div>
    </PageLayout>
  )
}
