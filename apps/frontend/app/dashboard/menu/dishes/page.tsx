'use client'

import { useState } from 'react'
import { ChefHat, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DishLibraryManager } from '@/components/menu/DishLibraryManager'
import { useDishes } from '@/hooks/use-dishes'
import Link from 'next/link'
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
        action={
          <Link href="/dashboard/menu">
            <Button className="bg-white/15 hover:bg-white/25 text-white border-0">
              <ArrowLeft className="h-4 w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Powr\u00f3t do Menu</span>
              <span className="sm:hidden">Menu</span>
            </Button>
          </Link>
        }
        stats={[
          { icon: ChefHat, label: 'Wszystkie dania', value: dishes.length },
        ]}
      />

      <DishLibraryManager searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
    </PageLayout>
  )
}
