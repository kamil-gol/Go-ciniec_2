'use client'

import { Hall, deleteHall } from '@/lib/api/halls'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, DollarSign, Calendar, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
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
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{hall.name}</CardTitle>
            {!hall.isActive && (
              <Badge variant="secondary">Nieaktywna</Badge>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={deleting}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
                className="text-destructive cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deleting ? 'Usuwanie...' : 'Usuń'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <Users className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Pojemność: <strong>{hall.capacity} osób</strong></span>
          </div>
          
          {/* Cennik - 3 kategorie */}
          <div className="bg-muted/50 p-3 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Dorośli:</span>
              <strong className="text-base">{hall.pricePerPerson} zł/os.</strong>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Dzieci:</span>
              <strong className="text-base">{hall.pricePerChild || hall.pricePerPerson} zł/os.</strong>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Maluchy (0-3 lat):</span>
              <strong className="text-base text-green-600">{Number(hall.pricePerToddler) === 0 ? 'Gratis' : `${hall.pricePerToddler} zł/os.`}</strong>
            </div>
          </div>

          {hall.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {hall.description}
            </p>
          )}
          {hall.amenities && hall.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2">
              {hall.amenities.slice(0, 3).map((amenity, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {amenity}
                </Badge>
              ))}
              {hall.amenities.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{hall.amenities.length - 3} więcej
                </Badge>
              )}
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t">
          <Link href={`/dashboard/halls/${hall.id}`}>
            <Button variant="outline" className="w-full">
              <Calendar className="mr-2 h-4 w-4" />
              Zobacz Kalendarz
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
