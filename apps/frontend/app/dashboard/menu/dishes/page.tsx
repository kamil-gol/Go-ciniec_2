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
        title="Biblioteka Dań"
        subtitle="Zarządzaj wszystkimi daniami w systemie"
        icon={ChefHat}
        backHref="/dashboard/menu"
        backLabel="Powrót do Menu"
        stats={[
          { icon: ChefHat, label: 'Wszystkie dania', value: dishes.length },
        ]}
      />

      <DishLibraryManager searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
    </PageLayout>
  )
}
