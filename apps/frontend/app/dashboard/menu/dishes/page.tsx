'use client'

import { useState } from 'react'
import { ChefHat } from 'lucide-react'
import { DishLibraryManager } from '@/components/menu/DishLibraryManager'
import { useDishes } from '@/hooks/use-dishes'
import { PageLayout, PageHero } from '@/components/shared'
import { moduleAccents } from '@/lib/design-tokens'

export default function DishesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: dishes = [] } = useDishes()
  const accent = moduleAccents.menu

  return (
    <PageLayout>
      <PageHero
        accent={accent}
        title="Biblioteka Da\u0144"
        subtitle="Zarz\u0105dzaj wszystkimi daniami w systemie"
        icon={ChefHat}
        backHref="/dashboard/menu"
        backLabel="Powr\u00f3t do Menu"
        stats={[
          { icon: ChefHat, label: 'Wszystkie dania', value: dishes.length },
        ]}
      />

      <DishLibraryManager searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
    </PageLayout>
  )
}
