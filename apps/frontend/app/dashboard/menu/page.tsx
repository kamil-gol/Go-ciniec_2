'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  UtensilsCrossed, ChefHat, Package, Sparkles, FileText, Tags,
  TrendingUp, Users, Calendar, ArrowRight, Plus
} from 'lucide-react'
import Link from 'next/link'
import { useMenuTemplates } from '@/hooks/use-menu'
import { useDishes } from '@/hooks/use-dishes'
import { useDishCategories } from '@/hooks/use-dish-categories'
import { useMenuOptions } from '@/hooks/use-menu-options'

export default function MenuDashboardPage() {
  const { data: templates = [] } = useMenuTemplates()
  const { data: dishes = [] } = useDishes()
  const { data: categories = [] } = useDishCategories()
  const { data: options = [] } = useMenuOptions()

  // Statystyki - pakiety z wszystkich szablonów
  const allPackages = templates.flatMap(t => t.packages || [])

  const stats = {
    dishes: dishes.length,
    templates: templates.length,
    packages: allPackages.length,
    categories: categories.length,
    options: options.length,
    activeTemplates: templates.filter(t => t.isActive).length,
    activeOptions: options.filter(o => o.isActive).length,
  }

  // Kategorie dań - używamy nazw z obiektów kategorii
  const dishCategories = dishes.reduce((acc: any, dish: any) => {
    const categoryName = dish.category?.name || 'Inne'
    acc[categoryName] = (acc[categoryName] || 0) + 1
    return acc
  }, {})

  const topCategories = Object.entries(dishCategories)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden rounded-b-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 text-white shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
        
        <div className="container mx-auto px-6 py-16 relative z-10">
          <div className="flex items-center justify-between">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                  <UtensilsCrossed className="h-12 w-12" />
                </div>
                <div>
                  <h1 className="text-5xl font-bold tracking-tight">Moduł Menu</h1>
                  <p className="text-white/90 text-lg mt-2">Kompleksowe zarządzanie menu, pakietami i opcjami</p>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex gap-6 mt-8">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/20">
                  <ChefHat className="h-5 w-5" />
                  <div>
                    <p className="text-xs text-white/80">Dania</p>
                    <p className="text-2xl font-bold">{stats.dishes}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/20">
                  <FileText className="h-5 w-5" />
                  <div>
                    <p className="text-xs text-white/80">Szablony</p>
                    <p className="text-2xl font-bold">{stats.templates}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/20">
                  <Sparkles className="h-5 w-5" />
                  <div>
                    <p className="text-xs text-white/80">Opcje</p>
                    <p className="text-2xl font-bold">{stats.options}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="hidden lg:block">
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Popularne kategorie
                  </h3>
                  <div className="space-y-2">
                    {topCategories.map(([category, count]: any) => (
                      <div key={category} className="flex items-center justify-between text-sm">
                        <span className="text-white/90">{category}</span>
                        <Badge variant="secondary" className="bg-white/20 text-white border-0">
                          {count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Grid */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          
          {/* Biblioteka Dań */}
          <Link href="/dashboard/menu/dishes">
            <Card className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden h-full">
              <div className="relative overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 group-hover:from-emerald-500/20 group-hover:via-teal-500/20 group-hover:to-cyan-500/20 transition-all" />
                <CardContent className="p-8 relative h-full flex flex-col">
                  <div className="flex-1">
                    <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-lg w-fit mb-4">
                      <ChefHat className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold group-hover:text-emerald-600 transition-colors mb-2">Biblioteka Dań</h3>
                    <p className="text-muted-foreground mb-4">Zarządzaj daniami w systemie</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{stats.dishes} dań</span>
                      <span>•</span>
                      <span>{stats.categories} kategorii</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 font-medium mt-4 group-hover:gap-4 transition-all">
                    Otwórz <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </div>
            </Card>
          </Link>

          {/* Kategorie Dań */}
          <Link href="/dashboard/menu/categories">
            <Card className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden h-full">
              <div className="relative overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-rose-500/10 group-hover:from-purple-500/20 group-hover:via-pink-500/20 group-hover:to-rose-500/20 transition-all" />
                <CardContent className="p-8 relative h-full flex flex-col">
                  <div className="flex-1">
                    <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg w-fit mb-4">
                      <Tags className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold group-hover:text-purple-600 transition-colors mb-2">Kategorie Dań</h3>
                    <p className="text-muted-foreground mb-4">Zarządzaj kategoriami dań</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{stats.categories} kategorii</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-purple-600 font-medium mt-4 group-hover:gap-4 transition-all">
                    Otwórz <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </div>
            </Card>
          </Link>

          {/* Opcje Menu - NOWE! */}
          <Link href="/dashboard/menu/options">
            <Card className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden h-full">
              <div className="relative overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-rose-500/10 to-red-500/10 group-hover:from-pink-500/20 group-hover:via-rose-500/20 group-hover:to-red-500/20 transition-all" />
                <CardContent className="p-8 relative h-full flex flex-col">
                  <div className="flex-1">
                    <div className="p-4 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl shadow-lg w-fit mb-4">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold group-hover:text-pink-600 transition-colors mb-2">Opcje Menu</h3>
                    <p className="text-muted-foreground mb-4">Dodatkowe opcje do pakietów</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{stats.options} opcji</span>
                      <span>•</span>
                      <span>{stats.activeOptions} aktywnych</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-pink-600 font-medium mt-4 group-hover:gap-4 transition-all">
                    Otwórz <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </div>
            </Card>
          </Link>

          {/* Szablony Menu */}
          <Link href="/dashboard/menu/templates">
            <Card className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden h-full">
              <div className="relative overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 group-hover:from-blue-500/20 group-hover:via-indigo-500/20 group-hover:to-purple-500/20 transition-all" />
                <CardContent className="p-8 relative h-full flex flex-col">
                  <div className="flex-1">
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl shadow-lg w-fit mb-4">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold group-hover:text-blue-600 transition-colors mb-2">Szablony Menu</h3>
                    <p className="text-muted-foreground mb-4">Konfiguruj szablony dla wydarzeń</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{stats.templates} szablonów</span>
                      <span>•</span>
                      <span>{stats.activeTemplates} aktywnych</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600 font-medium mt-4 group-hover:gap-4 transition-all">
                    Otwórz <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </div>
            </Card>
          </Link>

          {/* Pakiety */}
          <Link href="/dashboard/menu/packages">
            <Card className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden h-full">
              <div className="relative overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 group-hover:from-amber-500/20 group-hover:via-orange-500/20 group-hover:to-red-500/20 transition-all" />
                <CardContent className="p-8 relative h-full flex flex-col">
                  <div className="flex-1">
                    <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg w-fit mb-4">
                      <Package className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold group-hover:text-amber-600 transition-colors mb-2">Pakiety</h3>
                    <p className="text-muted-foreground mb-4">Zarządzaj pakietami menu</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{stats.packages} pakietów</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-amber-600 font-medium mt-4 group-hover:gap-4 transition-all">
                    Otwórz <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </div>
            </Card>
          </Link>

        </div>
      </div>
    </div>
  )
}
