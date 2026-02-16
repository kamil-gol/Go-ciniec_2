'use client'

import { useState } from 'react'
import { Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MenuOptionsManager } from '@/components/menu/MenuOptionsManager'
import { useMenuOptions } from '@/hooks/use-menu-options'
import Link from 'next/link'
import { PageLayout, PageHero } from '@/components/shared'
import { moduleAccents } from '@/lib/design-tokens'

export default function MenuOptionsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: options = [] } = useMenuOptions()
  const accent = moduleAccents.menu

  return (
    <PageLayout>
      <PageHero
        accent={accent}
        title="Opcje Menu"
        subtitle="Dodatkowe opcje do pakiet\u00f3w (napoje, desery, us\u0142ugi)"
        icon={Sparkles}
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
          { icon: Sparkles, label: 'Wszystkie opcje', value: options.length },
          { icon: CheckCircle2, label: 'Aktywne', value: options.filter(o => o.isActive).length },
        ]}
      />

      <MenuOptionsManager searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
    </PageLayout>
  )
}
