'use client'

import { useRouter } from 'next/navigation'
import {
  Edit, User, Calendar, CheckCircle2, Trash2, Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DetailHero } from '@/components/shared/DetailHero'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'

interface ClientHeroSectionProps {
  client: any
  isCompany: boolean
  isDeleted: boolean
  stats: {
    total: number
    confirmed: number
    completed: number
    totalSpent: number
  }
}

export function ClientHeroSection({ client, isCompany, isDeleted, stats }: ClientHeroSectionProps) {
  const router = useRouter()

  const clientTitle = isCompany && client.companyName
    ? client.companyName
    : `${client.firstName} ${client.lastName}`

  return (
    <DetailHero
      gradient={isCompany
        ? 'from-[#1e3a5f] via-[#2a4a70] to-[#1e3a5f]'
        : 'from-[#1e3a5f] via-[#2a4a70] to-[#1e3a5f]'
      }
      backHref="/dashboard/clients"
      backLabel="Powrót do listy"
      icon={isCompany ? Building2 : User}
      title={clientTitle}
      extraLine={isCompany ? `${client.firstName} ${client.lastName}` : undefined}
      subtitle={isCompany ? 'Profil firmy' : 'Profil klienta'}
      badges={
        <>
          {isCompany && (
            <Badge className="bg-purple-500/80 backdrop-blur-sm border-purple-300/30 text-white">
              <Building2 className="h-3 w-3 mr-1" />
              Firma
            </Badge>
          )}
          <Badge className="bg-white/20 backdrop-blur-sm border-white/30 text-white">
            <Calendar className="h-3 w-3 mr-1" />
            Dodano {format(new Date(client.createdAt), 'dd MMMM yyyy', { locale: pl })}
          </Badge>
          {stats.total > 0 && (
            <Badge className="bg-green-500 text-white border-0">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {stats.total} {stats.total === 1 ? 'rezerwacja' : 'rezerwacji'}
            </Badge>
          )}
          {isDeleted && (
            <Badge className="bg-red-500 text-white border-0">
              <Trash2 className="h-3 w-3 mr-1" />
              Usunięty
            </Badge>
          )}
        </>
      }
      actions={!isDeleted ? (
        <Button
          size="lg"
          onClick={() => router.push(`/dashboard/clients/${client.id}/edit`)}
          className="flex-1 sm:flex-none bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
        >
          <Edit className="mr-2 h-5 w-5" />
          Edytuj
        </Button>
      ) : undefined}
    />
  )
}
