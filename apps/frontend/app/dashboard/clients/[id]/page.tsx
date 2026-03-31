'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Edit, Trash2, User, Calendar,
  CheckCircle2, TrendingUp, DollarSign, History,
  Building2, Sparkles, FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingState } from '@/components/shared/LoadingState'
import { DetailHero } from '@/components/shared/DetailHero'
import { StatCard } from '@/components/shared/StatCard'
import { statGradients, layout, moduleAccents } from '@/lib/design-tokens'
import { getClientById, deleteClient } from '@/lib/api/clients'
import type { Client, Reservation } from '@/types'
import Link from 'next/link'
import AttachmentPanel from '@/components/attachments/attachment-panel'
import { EntityActivityTimeline } from '@/components/audit-log/EntityActivityTimeline'
import { GradientCard } from '@/components/shared/GradientCard'
import { DeleteClientModal } from '@/components/clients/delete-client-modal'
import { ContactsManager } from '@/components/clients/contacts-manager'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'

import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { CompanyInfoCard, ContactInfoCard } from './components/ClientInfoCards'
import { ClientReservationsHistory } from './components/ClientReservationsHistory'

type TabType = 'details' | 'history'

export default function ClientDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('details')

  const loadClient = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getClientById(params.id as string)
      setClient(data)
    } catch (error: any) {
      console.error('Error loading client:', error)
      toast.error('Nie udało się załadować klienta')
      router.push('/dashboard/clients')
    } finally {
      setLoading(false)
    }
  }, [params.id, toast, router])

  useEffect(() => {
    loadClient()
  }, [loadClient])

  const handleDelete = async () => {
    if (!client) return

    try {
      setDeleting(true)
      await deleteClient(client.id)
      toast.success('Dane klienta zostały zanonimizowane',)
      router.push('/dashboard/clients')
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.response?.data?.message || 'Nie udało się usunąć klienta')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <LoadingState message="Wczytywanie klienta..." />
      </div>
    )
  }

  if (!client) {
    return null
  }

  const isDeleted = client.isDeleted === true
  const isCompany = client.clientType === 'COMPANY'
  const contacts = client.contacts || []

  // Calculate stats
  const reservations = client.reservations || []
  const stats = {
    total: reservations.length,
    confirmed: reservations.filter((r: Reservation) => r.status === 'CONFIRMED').length,
    completed: reservations.filter((r: Reservation) => r.status === 'COMPLETED').length,
    totalSpent: reservations
      .filter((r: Reservation) => r.status === 'CONFIRMED' || r.status === 'COMPLETED')
      .reduce((sum: number, r: any) => sum + (Number(r.totalPrice) || 0), 0),
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4 space-y-8">
        <Breadcrumb />

        {/* Soft-deleted banner */}
        {isDeleted && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
            <Trash2 className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Klient usunięty</p>
              <p className="text-sm">Dane osobowe tego klienta zostały zanonimizowane. Rezerwacje pozostały w systemie.</p>
            </div>
          </div>
        )}

        {/* Premium Hero Section */}
        <DetailHero
          gradient={moduleAccents.clients.gradient}
          backHref="/dashboard/clients"
          backLabel="Powrót do listy"
          icon={isCompany ? Building2 : User}
          title={isCompany && client.companyName ? client.companyName : `${client.firstName} ${client.lastName}`}
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

        {/* Stats Grid — shared StatCard */}
        <div className={layout.statGrid}>
          <StatCard
            label="Rezerwacje"
            value={String(stats.total)}
            icon={Calendar}
            iconGradient={statGradients.count}
          />
          <StatCard
            label="Potwierdzone"
            value={String(stats.confirmed)}
            icon={CheckCircle2}
            iconGradient={statGradients.success}
          />
          <StatCard
            label="Zakończone"
            value={String(stats.completed)}
            icon={TrendingUp}
            iconGradient={statGradients.info}
          />
          <StatCard
            label="Wydano"
            value={`${stats.totalSpent.toLocaleString('pl-PL')} zł`}
            icon={DollarSign}
            iconGradient={statGradients.financial}
          />
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-full sm:w-fit">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'details'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            {isCompany ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
            {isCompany ? 'Dane firmy' : 'Dane klienta'}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <History className="h-4 w-4" />
            Historia zmian
          </button>
        </div>

        {/* Tab: Dane klienta / firmy */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Contact Info + Company Info */}
            <div className="lg:col-span-1 space-y-6 min-w-0">
              {/* Company Info Card */}
              {isCompany && <CompanyInfoCard client={client} />}

              {/* Contact Info Card */}
              <ContactInfoCard client={client} isCompany={isCompany} />

              {/* Contacts Manager - for COMPANY clients */}
              {isCompany && (
                <ContactsManager
                  clientId={client.id}
                  contacts={contacts}
                  readOnly={isDeleted}
                  onUpdate={loadClient}
                />
              )}

              {client.notes && (
                <Card className="border-0 shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/30 dark:via-amber-950/30 dark:to-yellow-950/30 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg shadow-lg">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <h2 className="text-xl font-bold">Notatki</h2>
                    </div>
                    <div className="p-3 bg-white dark:bg-black/20 rounded-lg">
                      <p className="text-muted-foreground leading-relaxed">{client.notes}</p>
                    </div>
                  </div>
                </Card>
              )}

              <GradientCard
                title="Szybkie akcje"
                icon={<Sparkles className="h-5 w-5 text-white" />}
                iconGradient="from-amber-500 to-orange-500"
                headerGradient="from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-red-950/30"
              >
                  <div className="space-y-3">
                    {!isDeleted && (
                      <>
                        <Link href={`/dashboard/reservations/new?clientId=${client.id}`}>
                          <Button variant="outline" className="w-full justify-start bg-white dark:bg-black/20 border-0 shadow-sm hover:shadow-md" size="lg">
                            <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
                            Nowa rezerwacja
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          className="w-full justify-start bg-white dark:bg-black/20 border-0 shadow-sm hover:shadow-md"
                          size="lg"
                          onClick={() => router.push(`/dashboard/clients/${client.id}/edit`)}
                        >
                          <Edit className="mr-2 h-4 w-4 flex-shrink-0" />
                          Edytuj dane
                        </Button>
                      </>
                    )}
                    {!isDeleted && (
                      <Button
                        variant="outline"
                        className="w-full justify-start bg-white dark:bg-black/20 border-0 shadow-sm hover:shadow-md text-red-600 hover:text-red-700"
                        size="lg"
                        disabled={deleting}
                        onClick={() => setShowDeleteModal(true)}
                      >
                        <Trash2 className="mr-2 h-4 w-4 flex-shrink-0" />
                        Usuń klienta
                      </Button>
                    )}
                  </div>
              </GradientCard>
            </div>

            {/* Right Column - Reservations History + Attachments */}
            <div className="lg:col-span-2 space-y-6 min-w-0">
              <GradientCard
                title="Historia rezerwacji"
                icon={<Sparkles className="h-5 w-5 text-white" />}
                iconGradient="from-blue-500 to-cyan-500"
                headerGradient="from-blue-50 via-cyan-50 to-teal-50 dark:from-blue-950/30 dark:via-cyan-950/30 dark:to-teal-950/30"
              >
                  <ClientReservationsHistory
                    reservations={reservations}
                    clientId={client.id}
                    isDeleted={isDeleted}
                  />
              </GradientCard>

              {/* Attachments Panel */}
              <AttachmentPanel
                entityType="CLIENT"
                entityId={client.id}
                title="Załączniki klienta"
                className="shadow-xl"
                readOnly={isDeleted}
              />
            </div>
          </div>
        )}

        {/* Tab: Historia zmian */}
        {activeTab === 'history' && (
          <div className="max-w-4xl">
            <EntityActivityTimeline
              entityType="CLIENT"
              entityId={client.id}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {client && (
        <DeleteClientModal
          open={showDeleteModal}
          onOpenChange={setShowDeleteModal}
          clientName={isCompany && client.companyName ? client.companyName : `${client.firstName} ${client.lastName}`}
          clientId={client.id}
          onConfirm={handleDelete}
          isDeleting={deleting}
        />
      )}
    </div>
  )
}
