'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Edit, User, Calendar, CheckCircle2, Trash2, Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

  return (
    <div className={`relative overflow-hidden rounded-2xl p-8 text-white shadow-2xl bg-gradient-to-r ${
      isCompany
        ? 'from-purple-600 via-indigo-600 to-blue-600'
        : 'from-indigo-600 via-purple-600 to-pink-600'
    }`}>
      <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />

      <div className="relative z-10 space-y-6">
        <Link href="/dashboard/clients">
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót do listy
          </Button>
        </Link>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                {isCompany ? <Building2 className="h-8 w-8" /> : <User className="h-8 w-8" />}
              </div>
              <div>
                <h1 className="text-4xl font-bold">
                  {isCompany && client.companyName ? client.companyName : `${client.firstName} ${client.lastName}`}
                </h1>
                {isCompany && (
                  <p className="text-white/80 text-base mt-0.5">
                    {client.firstName} {client.lastName}
                  </p>
                )}
                <p className="text-white/90 text-lg mt-1">
                  {isCompany ? 'Profil firmy' : 'Profil klienta'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
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
            </div>
          </div>

          {!isDeleted && (
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                size="lg"
                onClick={() => router.push(`/dashboard/clients/${client.id}/edit`)}
                className="flex-1 sm:flex-none bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
              >
                <Edit className="mr-2 h-5 w-5" />
                Edytuj
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
    </div>
  )
}
