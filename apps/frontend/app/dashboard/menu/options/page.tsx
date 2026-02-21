'use client'

import { useState } from 'react'
import { Sparkles, CheckCircle } from 'lucide-react'
import { MenuOptionsManager } from '@/components/menu/MenuOptionsManager'
import { useMenuOptions } from '@/hooks/use-menu-options'
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
        subtitle="Dodatkowe opcje do pakietów (napoje, desery, usługi)"
        icon={Sparkles}
        backHref="/dashboard/menu"
        backLabel="Powrót do Menu"
        stats={[
          { icon: Sparkles, label: 'Wszystkie opcje', value: options.length },
          { icon: CheckCircle, label: 'Aktywne', value: options.filter(o => o.isActive).length },
        ]}
      />

      <MenuOptionsManager searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
    </PageLayout>
  )
}
