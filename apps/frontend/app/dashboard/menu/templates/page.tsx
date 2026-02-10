'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, ArrowLeft, Construction } from 'lucide-react'
import Link from 'next/link'

export default function MenuTemplatesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden rounded-b-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
        
        <div className="container mx-auto px-6 py-12 relative z-10">
          <Link href="/dashboard/menu">
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Powrót do Menu
            </Button>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
              <FileText className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-5xl font-bold tracking-tight">Szablony Menu</h1>
              <p className="text-white/90 text-lg mt-2">Konfiguruj szablony menu dla typów wydarzeń</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Content */}
      <div className="container mx-auto px-6 py-12">
        <Card className="border-0 shadow-2xl">
          <CardContent className="p-16 text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-full flex items-center justify-center mx-auto mb-8">
              <Construction className="h-16 w-16 text-blue-600" />
            </div>
            <h2 className="text-4xl font-bold mb-4">W trakcie budowy</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Moduł szablonów menu jest obecnie w fazie rozwoju. Wkrótce będzie można tworzyć i zarządzać szablonamimenu dla różnych typów wydarzeń.
            </p>
            <Link href="/dashboard/menu">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Powrót do menu głównego
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
