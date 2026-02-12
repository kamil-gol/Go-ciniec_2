'use client'

import { Theater, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageLayout, PageHero, EmptyState } from '@/components/shared'
import { moduleAccents } from '@/lib/design-tokens'

export default function EventTypesPage() {
  const accent = moduleAccents.eventTypes

  return (
    <PageLayout>
      <PageHero
        accent={accent}
        title="Typy Wydarzeń"
        subtitle="Konfiguruj rodzaje imprez i ich parametry"
        icon={Theater}
        action={
          <Button size="lg" className="bg-white text-fuchsia-600 hover:bg-white/90 shadow-xl">
            <Plus className="mr-2 h-5 w-5" />
            Nowy Typ
          </Button>
        }
      />

      <div className="rounded-2xl bg-white dark:bg-neutral-800/80 p-8 shadow-soft border border-neutral-100 dark:border-neutral-700/50">
        <EmptyState
          icon={Theater}
          title="Moduł Typów Wydarzeń"
          description="System typów wydarzeń w przygotowaniu — wesela, komunie, urodziny, pakiety cenowe, wymagane zaliczki, szablony dokumentów."
        />
        <div className="flex justify-center mt-4">
          <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${accent.badge} ${accent.badgeText}`}>
            ✨ Nowy moduł — Sprint 4
          </span>
        </div>
      </div>
    </PageLayout>
  )
}
