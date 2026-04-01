'use client'

import { useState } from 'react'
import { ChefHat } from 'lucide-react'
import { DishLibraryManager } from '@/components/menu/DishLibraryManager'
import { useDishes } from '@/hooks/use-dishes'
import { PageLayout } from '@/components/shared'
import { PageHeader } from '@/components/shared/PageHeader'
import { moduleAccents } from '@/lib/design-tokens'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

export default function DishesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: dishes = [] } = useDishes()
  const accent = moduleAccents.menu

  return (
    <PageLayout>
      <Breadcrumb />
      <PageHeader
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
