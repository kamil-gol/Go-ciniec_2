'use client'

import { useState, useMemo } from 'react'
import { ChefHat, Tags, AlertTriangle } from 'lucide-react'
import { DishLibraryManager } from '@/components/menu/DishLibraryManager'
import { useDishes, useDishCategories } from '@/hooks/use-dishes'
import { PageLayout, PageHero, StatCard } from '@/components/shared'
import { moduleAccents, statGradients, layout } from '@/lib/design-tokens'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

export default function DishesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: dishes = [] } = useDishes()
  const { data: categories = [] } = useDishCategories()
  const accent = moduleAccents.menu

  const dishesWithAllergens = useMemo(
    () => dishes.filter((d) => d.allergens && d.allergens.length > 0).length,
    [dishes]
  )

  return (
    <PageLayout>
      <Breadcrumb />
      <PageHero
        accent={accent}
        title="Biblioteka Dań"
        subtitle="Zarządzaj wszystkimi daniami w systemie"
        icon={ChefHat}
        backHref="/dashboard/menu/templates"
        backLabel="Powrót do Menu"
      />

      <div className={layout.statGrid3}>
        <StatCard label="Wszystkie dania" value={dishes.length} subtitle="Dań w systemie" icon={ChefHat} iconGradient={statGradients.count} delay={0.1} />
        <StatCard label="Kategorie" value={categories.length} subtitle="Grup dań" icon={Tags} iconGradient={statGradients.success} delay={0.2} />
        <StatCard label="Z alergenami" value={dishesWithAllergens} subtitle="Dań z alergenami" icon={AlertTriangle} iconGradient={statGradients.alert} delay={0.3} />
      </div>

      <DishLibraryManager searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
    </PageLayout>
  )
}
