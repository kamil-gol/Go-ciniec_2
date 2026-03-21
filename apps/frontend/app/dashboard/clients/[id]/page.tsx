'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Edit, Trash2, User, Mail, Phone, MapPin,
  Calendar, Clock, CheckCircle2, XCircle,
  Building2, Sparkles, FileText, TrendingUp, DollarSign, History,
  Globe, Hash, Briefcase
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getClientById, deleteClient } from '@/lib/api/clients'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import AttachmentPanel from '@/components/attachments/attachment-panel'
import { EntityActivityTimeline } from '@/components/audit-log/EntityActivityTimeline'
import { DeleteClientModal } from '@/components/clients/delete-client-modal'
import { ContactsManager } from '@/components/clients/contacts-manager'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Oczekująca',
  CONFIRMED: 'Potwierdzona',
  CANCELLED: 'Anulowana',
  COMPLETED: 'Zakończona',
}

const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  PENDING: { color: 'bg-orange-500', icon: Clock },
  CONFIRMED: { color: 'bg-green-500', icon: CheckCircle2 },
  CANCELLED: { color: 'bg-red-500', icon: XCircle },
  COMPLETED: { color: 'bg-blue-500', icon: CheckCircle2 },
}

type TabType = 'details' | 'history'

export default function ClientDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
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
      toast({
        title: 'Błąd',
        description: 'Nie udało się załadować klienta',
        variant: 'destructive',
      })
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
      toast({
        title: 'Sukces',
        description: 'Dane klienta zostały zanonimizowane',
      })
      router.push('/dashboard/clients')
    } catch (error: any) {
      toast({
        title: 'Błąd',
        description: error?.response?.data?.error || error?.response?.data?.message || 'Nie udało się usunąć klienta',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Wczytywanie...</p>
        </div>
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

            <div className="flex justify-between items-start">
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
                <div className="flex gap-3">
                  <Button 
                    size="lg" 
                    onClick={() => router.push(`/dashboard/clients/${client.id}/edit`)}
                    className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
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
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
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
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
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
              {isCompany && (
                <Card className="border-0 shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg shadow-lg">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <h2 className="text-xl font-bold">Dane firmy</h2>
                    </div>
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
                  </div>
                </Card>
              )}

              {/* Contact Info Card */}
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg shadow-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold">
                      {isCompany ? 'Osoba reprezentująca' : 'Dane kontaktowe'}
                    </h2>
                  </div>
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
                </div>
              </Card>

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
                  {reservations.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-semibold text-muted-foreground">Brak rezerwacji</p>
                      <p className="text-sm text-muted-foreground mt-1">Ten klient nie ma jeszcze żadnych rezerwacji</p>
                      {!isDeleted && (
                        <Link href={`/dashboard/reservations/list?create=true&clientId=${client.id}`}>
                          <Button className="mt-4" size="lg">
                            <Calendar className="mr-2 h-4 w-4" />
                            Utwórz pierwszą rezerwację
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reservations.map((reservation: any) => {
                        const eventDate = reservation.startDateTime 
                          ? new Date(reservation.startDateTime) 
                          : reservation.date 
                          ? new Date(reservation.date) 
                          : null

                        const statusCfg = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.PENDING
                        const StatusIcon = statusCfg.icon
                        const statusLabel = STATUS_LABELS[reservation.status] || reservation.status

                        return (
                          <Link key={reservation.id} href={`/dashboard/reservations/${reservation.id}`}>
                            <Card className="border-2 hover:border-indigo-300 transition-all hover:shadow-lg cursor-pointer">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-2 flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <Badge className={`${statusCfg.color} text-white border-0`}>
                                        <StatusIcon className="h-3 w-3 mr-1" />
                                        {statusLabel}
                                      </Badge>
                                      {eventDate && (
                                        <span className="text-sm text-muted-foreground">
                                          {format(eventDate, 'dd MMM yyyy', { locale: pl })}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Building2 className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-semibold">{reservation.hall?.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                      <span>{reservation.eventType?.name}</span>
                                      <span>{"\u2022"}</span>
                                      <span>{(reservation.adults || 0) + (reservation.children || 0) + (reservation.toddlers || 0)} osób</span>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0 ml-4">
                                    <p className="text-2xl font-bold">{Number(reservation.totalPrice || 0).toLocaleString('pl-PL')} zł</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        )
                      })}
                    </div>
                  )}
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
