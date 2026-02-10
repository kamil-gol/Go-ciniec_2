'use client'

import { useState } from 'react'
import { ChefHat, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DishLibraryManager } from '@/components/menu/DishLibraryManager'
import { useDishes } from '@/hooks/use-dishes-courses'
import Link from 'next/link'

export default function DishesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: dishes = [] } = useDishes()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden rounded-b-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
        
        <div className="container mx-auto px-6 py-12 relative z-10">
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <Link href="/dashboard/menu">
                <Button variant="ghost" className="text-white hover:bg-white/20 mb-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Powrót do Menu
                </Button>
              </Link>
              
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                  <ChefHat className="h-10 w-10" />
                </div>
                <div>
                  <h1 className="text-5xl font-bold tracking-tight">Biblioteka Dań</h1>
                  <p className="text-white/90 text-lg mt-2">Zarządzaj wszystkimi daniami w systemie</p>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex gap-6 mt-6">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
                  <ChefHat className="h-5 w-5" />
                  <div>
                    <p className="text-xs text-white/80">Wszystkie dania</p>
                    <p className="text-xl font-bold">{dishes.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <DishLibraryManager searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </div>
    </div>
  )
}
