'use client'

import { Hall, deleteHall } from '@/lib/api/halls'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Calendar, MoreVertical, Eye, Edit, Trash2, Sparkles, CheckCircle2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

interface HallCardProps {
  hall: Hall
  onUpdate: () => void
}

export function HallCard({ hall, onUpdate }: HallCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Czy na pewno chcesz usunąć salę "${hall.name}"?`)) return

    try {
      setDeleting(true)
      await deleteHall(hall.id)
      toast({
        title: 'Sukces',
        description: `Sala "${hall.name}" została usunięta`,
      })
      onUpdate()
    } catch (error: any) {
      console.error('Error deleting hall:', error)
      toast({
        title: 'Błąd',
        description: error.response?.data?.message || 'Nie udało się usunąć sali',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-card via-card to-card/80">
      {/* Gradient border effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
      
      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full opacity-50" />
      
      <CardHeader className="relative z-10">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                  {hall.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  {hall.isActive ? (
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 border-0">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Aktywna
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Nieaktywna</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                disabled={deleting}
                className="hover:bg-purple-100 dark:hover:bg-purple-900/20"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/halls/${hall.id}`} className="cursor-pointer">
                  <Eye className="mr-2 h-4 w-4" />
                  Szczegóły
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/halls/${hall.id}/edit`} className="cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" />
                  Edytuj
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete}
                disabled={deleting}
                className="text-destructive cursor-pointer focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deleting ? 'Usuwanie...' : 'Usuń'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10 space-y-4">
        {/* Capacity */}
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-md">
            <Users className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Pojemność</div>
            <div className="text-lg font-bold">{hall.capacity} osób</div>
          </div>
        </div>
        
        {/* Premium Pricing Box - 3 tiers */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-indigo-950/30 p-4 border border-purple-200/50 dark:border-purple-800/50 shadow-inner">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full" />
          
          <div className="relative space-y-3">
            <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-3">
              💰 Cennik
            </div>
            
            {/* Adults */}
            <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" />
                <span className="text-sm font-medium text-muted-foreground">Dorośli:</span>
              </div>
              <strong className="text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {hall.pricePerPerson} zł
              </strong>
            </div>
            
            {/* Children */}
            <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                <span className="text-sm font-medium text-muted-foreground">Dzieci (4-12):</span>
              </div>
              <strong className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {hall.pricePerChild || hall.pricePerPerson} zł
              </strong>
            </div>
            
            {/* Toddlers */}
            <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />
                <span className="text-sm font-medium text-muted-foreground">Maluchy (0-3):</span>
              </div>
              <strong className="text-lg font-bold">
                {Number(hall.pricePerToddler) === 0 ? (
                  <span className="text-green-600 dark:text-green-400 font-bold">✨ Gratis</span>
                ) : (
                  <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {hall.pricePerToddler} zł
                  </span>
                )}
              </strong>
            </div>
          </div>
        </div>

        {/* Description */}
        {hall.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {hall.description}
          </p>
        )}
        
        {/* Amenities */}
        {hall.amenities && hall.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {hall.amenities.slice(0, 3).map((amenity, idx) => (
              <Badge 
                key={idx} 
                variant="outline" 
                className="text-xs border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors"
              >
                {amenity}
              </Badge>
            ))}
            {hall.amenities.length > 3 && (
              <Badge 
                variant="outline" 
                className="text-xs bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 border-purple-300 dark:border-purple-700"
              >
                +{hall.amenities.length - 3} więcej
              </Badge>
            )}
          </div>
        )}
        
        {/* CTA Button */}
        <div className="pt-2">
          <Link href={`/dashboard/halls/${hall.id}`}>
            <Button 
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <Calendar className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
              Zobacz Kalendarz
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
