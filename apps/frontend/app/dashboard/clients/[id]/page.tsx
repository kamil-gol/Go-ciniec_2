'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Edit, Trash2, User, Calendar,
  CheckCircle2, TrendingUp, DollarSign, History,
  Building2, Sparkles, FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingState } from '@/components/shared/LoadingState'
import { getClientById, deleteClient } from '@/lib/api/clients'
import Link from 'next/link'
import AttachmentPanel from '@/components/attachments/attachment-panel'
import { EntityActivityTimeline } from '@/components/audit-log/EntityActivityTimeline'
import { DeleteClientModal } from '@/components/clients/delete-client-modal'
import { ContactsManager } from '@/components/clients/contacts-manager'
import { toast } from 'sonner'

import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { ClientHeroSection } from './components/ClientHeroSection'
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
    confirmed: reservations.filter((r: any) => r.status === 'CONFIRMED').length,
    completed: reservations.filter((r: any) => r.status === 'COMPLETED').length,
    totalSpent: reservations
      .filter((r: any) => r.status === 'CONFIRMED' || r.status === 'COMPLETED')
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
        <ClientHeroSection
          client={client}
          isCompany={isCompany}
          isDeleted={isDeleted}
          stats={stats}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Rezerwacje</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Potwierdzone</p>
                  <p className="text-3xl font-bold">{stats.confirmed}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Zakończone</p>
                  <p className="text-3xl font-bold">{stats.completed}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Wydano</p>
                  <p className="text-3xl font-bold">{stats.totalSpent.toLocaleString('pl-PL')} zł</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit">
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
                <Card className="border-0 shadow-xl">
                  <CardHeader className="border-b">
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      Notatki
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground leading-relaxed">{client.notes}</p>
                  </CardContent>
                </Card>
              )}

              <Card className="border-0 shadow-xl">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg">Szybkie akcje</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  {!isDeleted && (
                    <>
                      <Link href={`/dashboard/reservations/list?create=true&clientId=${client.id}`}>
                        <Button variant="outline" className="w-full justify-start" size="lg">
                          <Calendar className="mr-2 h-4 w-4" />
                          Nowa rezerwacja
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        size="lg"
                        onClick={() => router.push(`/dashboard/clients/${client.id}/edit`)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edytuj dane
                      </Button>
                    </>
                  )}
                  {!isDeleted && (
                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-600 hover:text-red-700"
                      size="lg"
                      disabled={deleting}
                      onClick={() => setShowDeleteModal(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Usuń klienta
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Reservations History + Attachments */}
            <div className="lg:col-span-2 space-y-6 min-w-0">
              <Card className="border-0 shadow-xl">
                <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Historia rezerwacji</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ClientReservationsHistory
                    reservations={reservations}
                    clientId={client.id}
                    isDeleted={isDeleted}
                  />
                </CardContent>
              </Card>

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
