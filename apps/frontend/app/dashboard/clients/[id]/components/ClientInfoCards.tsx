'use client'

import {
  User, Mail, Phone, MapPin, Building2, Globe, Hash, Briefcase,
} from 'lucide-react'
import { SectionCard } from '@/components/shared/SectionCard'

interface ClientInfoCardsProps {
  client: any
  isCompany: boolean
}

export function CompanyInfoCard({ client }: { client: any }) {
  return (
    <SectionCard
      variant="gradient"
      title="Dane firmy"
      icon={<Building2 className="h-5 w-5 text-white" />}
      iconGradient="from-purple-500 to-indigo-500"
      headerGradient="from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950/30 dark:via-indigo-950/30 dark:to-blue-950/30"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-white dark:bg-black/20 rounded-lg">
          <Building2 className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Nazwa firmy</p>
            <p className="text-base font-semibold truncate">{client.companyName}</p>
          </div>
        </div>

        {client.nip && (
          <div className="flex items-start gap-3 p-3 bg-white dark:bg-black/20 rounded-lg">
            <Hash className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">NIP</p>
              <p className="text-base font-semibold font-mono">{client.nip}</p>
            </div>
          </div>
        )}

        {client.regon && (
          <div className="flex items-start gap-3 p-3 bg-white dark:bg-black/20 rounded-lg">
            <Hash className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">REGON</p>
              <p className="text-base font-semibold font-mono">{client.regon}</p>
            </div>
          </div>
        )}

        {client.industry && (
          <div className="flex items-start gap-3 p-3 bg-white dark:bg-black/20 rounded-lg">
            <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Branża</p>
              <p className="text-base font-semibold">{client.industry}</p>
            </div>
          </div>
        )}

        {client.website && (
          <div className="flex items-start gap-3 p-3 bg-white dark:bg-black/20 rounded-lg">
            <Globe className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Strona www</p>
              <a
                href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-semibold text-indigo-600 dark:text-indigo-400 hover:underline break-all"
              >
                {client.website}
              </a>
            </div>
          </div>
        )}

        {client.companyAddress && (
          <div className="flex items-start gap-3 p-3 bg-white dark:bg-black/20 rounded-lg">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Adres firmy</p>
              <p className="text-base font-semibold">{client.companyAddress}</p>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  )
}

export function ContactInfoCard({ client, isCompany }: ClientInfoCardsProps) {
  return (
    <SectionCard
      variant="gradient"
      title={isCompany ? 'Osoba reprezentująca' : 'Dane kontaktowe'}
      icon={<User className="h-5 w-5 text-white" />}
      iconGradient="from-indigo-500 to-purple-500"
      headerGradient="from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-white dark:bg-black/20 rounded-lg">
          <User className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Imię i nazwisko</p>
            <p className="text-base font-semibold">
              {client.firstName} {client.lastName}
            </p>
          </div>
        </div>

        {client.email && (
          <div className="flex items-start gap-3 p-3 bg-white dark:bg-black/20 rounded-lg">
            <Mail className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-base font-semibold break-all">{client.email}</p>
            </div>
          </div>
        )}

        {client.phone && (
          <div className="flex items-start gap-3 p-3 bg-white dark:bg-black/20 rounded-lg">
            <Phone className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Telefon</p>
              <p className="text-base font-semibold">{client.phone}</p>
            </div>
          </div>
        )}

        {client.address && (
          <div className="flex items-start gap-3 p-3 bg-white dark:bg-black/20 rounded-lg">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Adres</p>
              <p className="text-base font-semibold">{client.address}</p>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  )
}
