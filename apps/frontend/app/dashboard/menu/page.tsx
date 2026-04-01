'use client'

import { Card } from '@/components/ui/card'
import {
  UtensilsCrossed, ChefHat, Package, FileText, Tags,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { useMenuTemplates } from '@/hooks/use-menu'
import { useDishes } from '@/hooks/use-dishes'
import { useDishCategories } from '@/hooks/use-menu-config'
import { PageLayout } from '@/components/shared'
import { PageHeader } from '@/components/shared/PageHeader'
import { moduleAccents } from '@/lib/design-tokens'
import { motion } from 'framer-motion'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

export default function MenuDashboardPage() {
  const { data: templates = [] } = useMenuTemplates()
  const { data: dishes = [] } = useDishes()
  const { data: categories = [] } = useDishCategories()
  const accent = moduleAccents.menu

  const allPackages = templates.flatMap(t => t.packages || [])

  const stats = {
    dishes: dishes.length,
    templates: templates.length,
    packages: allPackages.length,
    categories: categories.length,
    activeTemplates: templates.filter(t => t.isActive).length,
  }

  const navCards = [
    { href: '/dashboard/menu/templates', icon: FileText, title: 'Szablony Menu', desc: 'Konfiguruj szablony dla wydarzeń', stat: `${stats.templates} szablonów \u2022 ${stats.activeTemplates} aktywnych`, gradient: 'from-primary-500 to-primary-600', hoverText: 'text-primary-600 dark:text-primary-400' },
    { href: '/dashboard/menu/packages', icon: Package, title: 'Pakiety', desc: 'Zarządzaj pakietami menu', stat: `${stats.packages} pakietów`, gradient: 'from-primary-500 to-primary-600', hoverText: 'text-primary-600 dark:text-primary-400' },
    { href: '/dashboard/menu/categories', icon: Tags, title: 'Kategorie Dań', desc: 'Zarządzaj kategoriami dań', stat: `${stats.categories} kategorii`, gradient: 'from-primary-500 to-primary-600', hoverText: 'text-primary-600 dark:text-primary-400' },
    { href: '/dashboard/menu/dishes', icon: ChefHat, title: 'Biblioteka Dań', desc: 'Zarządzaj daniami w systemie', stat: `${stats.dishes} dań \u2022 ${stats.categories} kategorii`, gradient: 'from-primary-500 to-primary-600', hoverText: 'text-primary-600 dark:text-primary-400' },
  ]

  return (
    <PageLayout>
      {/* Hero */}
      <PageHeader
        title="Moduł Menu"
        subtitle="Kompleksowe zarządzanie menu, pakietami i szablonami"
        icon={UtensilsCrossed}
        stats={[
          { icon: ChefHat, label: 'Dania', value: stats.dishes },
          { icon: FileText, label: 'Szablony', value: stats.templates },
          { icon: Package, label: 'Pakiety', value: stats.packages },
        ]}
      />

      {/* Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {navCards.map((card, index) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.href}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
            >
              <Link href={card.href}>
                <Card className="group hover:shadow-medium hover:-translate-y-1 cursor-pointer overflow-hidden h-full">
                  <div className="relative overflow-hidden h-full">
                    <Breadcrumb />
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-[0.04] group-hover:opacity-[0.08] transition-opacity`} />
                    <div className="p-8 relative h-full flex flex-col">
                      <div className="flex-1">
                        <div className={`p-4 bg-gradient-to-br ${card.gradient} rounded-2xl shadow-lg w-fit mb-4 group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="h-8 w-8 text-white" />
                        </div>
                        <h3 className={`text-2xl font-bold group-hover:${card.hoverText} transition-colors mb-2 text-neutral-900 dark:text-neutral-100`}>{card.title}</h3>
                        <p className="text-neutral-500 dark:text-neutral-300 mb-4">{card.desc}</p>
                        <p className="text-sm text-neutral-400 dark:text-neutral-500">{card.stat}</p>
                      </div>
                      <div className={`flex items-center gap-2 ${card.hoverText} font-medium mt-4 group-hover:gap-4 transition-all`}>
                        Otwórz <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </PageLayout>
  )
}
