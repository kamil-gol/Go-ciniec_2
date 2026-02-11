'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ChefHat, Book, Sparkles } from 'lucide-react'
import Link from 'next/link'

export function QuickAccessMenu() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Dishes Quick Access */}
      <Link href="/dashboard/menu/dishes">
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden group">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 group-hover:from-emerald-500/20 group-hover:via-teal-500/20 group-hover:to-cyan-500/20 transition-all" />
            <CardContent className="p-8 relative">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-lg">
                  <ChefHat className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold group-hover:text-emerald-600 transition-colors">Biblioteka Dań</h3>
                  <p className="text-muted-foreground mt-1">Zarządzaj daniami w systemie</p>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </Link>

      {/* Addon Groups Quick Access */}
      <Link href="/dashboard/menu/addons">
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden group">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-rose-500/10 group-hover:from-purple-500/20 group-hover:via-pink-500/20 group-hover:to-rose-500/20 transition-all" />
            <CardContent className="p-8 relative">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold group-hover:text-purple-600 transition-colors">Grupy Dodatków</h3>
                  <p className="text-muted-foreground mt-1">Konfiguruj dodatki do pakietów</p>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </Link>

      {/* Courses Quick Access */}
      <Link href="/dashboard/menu/courses">
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden group">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 group-hover:from-blue-500/20 group-hover:via-indigo-500/20 group-hover:to-purple-500/20 transition-all" />
            <CardContent className="p-8 relative">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl shadow-lg">
                  <Book className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold group-hover:text-blue-600 transition-colors">Kursy Menu</h3>
                  <p className="text-muted-foreground mt-1">Konfiguruj kursy dla pakietów</p>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </Link>
    </div>
  )
}
