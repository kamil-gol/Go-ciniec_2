'use client'

import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Loader2, 
  AlertCircle, 
  Edit, 
  Trash2,
  Users,
  DollarSign,
  CalendarDays,
  StickyNote,
  ExternalLink
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useClient, useDeleteClient } from '@/lib/api/clients'
import { ReservationStatus } from '@/types'
import { format, isValid, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import Link from 'next/link'

const statusColors = {
  [ReservationStatus.PENDING]: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  [ReservationStatus.CONFIRMED]: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  [ReservationStatus.COMPLETED]: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  [ReservationStatus.CANCELLED]: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  [ReservationStatus.RESERVED]: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
}

const statusLabels = {
  [ReservationStatus.PENDING]: 'Oczekujące',
  [ReservationStatus.CONFIRMED]: 'Potwierdzone',
  [ReservationStatus.COMPLETED]: 'Zakończone',
  [ReservationStatus.CANCELLED]: 'Anulowane',
  [ReservationStatus.RESERVED]: 'W kolejce',
}

// Helper to safely format dates
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Brak daty'
  
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString)
    if (!isValid(date)) return 'Nieprawidłowa data'
    return format(date, 'd MMMM yyyy', { locale: pl })
  } catch (error) {
    console.error('Error formatting date:', dateString, error)
    return 'Błąd daty'
  }
}

export default function ClientDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const { data: client, isLoading, error } = useClient(clientId)
  const deleteClient = useDeleteClient()

  // TODO: Replace with actual auth check when implemented
  const canDelete = true
  const hasReservations = client?.reservations && client.reservations.length > 0

  const handleDelete = async () => {
    if (hasReservations) {
      alert('Nie można usunąć klienta, który ma rezerwacje!')
      return
    }

    if (confirm(`Czy na pewno chcesz usunąć klienta: ${client?.firstName} ${client?.lastName}?`)) {
      try {
        await deleteClient.mutateAsync(clientId)
        router.push('/dashboard/clients')
      } catch (error) {
        console.error('Error deleting client:', error)
      }
    }
  }

  // Calculate stats
  const stats = {
    totalReservations: client?.reservations?.length || 0,
    totalSpent: client?.reservations?.reduce((sum, r) => sum + (r.totalPrice || 0), 0) || 0,
    averageGuests: client?.reservations && client.reservations.length > 0
      ? Math.round(client.reservations.reduce((sum, r) => sum + (r.guests || 0), 0) / client.reservations.length)
      : 0,
    memberSince: formatDate(client?.createdAt),
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">
            Ładowanie danych klienta...
          </p>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !client) {
    return (
      <DashboardLayout>
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-8 text-center border border-red-200 dark:border-red-800">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">
            Błąd ładowania klienta
          </h3>
          <p className="text-red-700 dark:text-red-300 mb-4">
            {error instanceof Error ? error.message : 'Klient nie został znaleziony'}
          </p>
          <button
            onClick={() => router.push('/dashboard/clients')}
            className="px-6 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Powrót do listy klientów
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Powrót
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                {client.firstName} {client.lastName}
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                Klient od: {stats.memberSince}
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/dashboard/clients/${clientId}/edit`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edytuj
              </Link>

              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={hasReservations}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    hasReservations
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30'
                  }`}
                  title={hasReservations ? 'Nie można usunąć klienta z rezerwacjami' : 'Usuń klienta'}
                >
                  <Trash2 className="w-4 h-4" />
                  Usuń
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-soft border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Rezerwacje
              </p>
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {stats.totalReservations}
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-soft border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Łącznie wydano
              </p>
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {stats.totalSpent.toLocaleString('pl-PL')} zł
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-soft border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Średnio gości
              </p>
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {stats.averageGuests}
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-soft border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <CalendarDays className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Klient od
              </p>
            </div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {stats.memberSince}
            </p>
          </div>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-soft border border-neutral-200 dark:border-neutral-700"
        >
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            Dane kontaktowe
          </h2>
          
          <div className="space-y-3">
            {client.email && (
              <a
                href={`mailto:${client.email}`}
                className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
              >
                <Mail className="w-5 h-5" />
                <span>{client.email}</span>
              </a>
            )}

            {client.phone && (
              <a
                href={`tel:${client.phone}`}
                className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
              >
                <Phone className="w-5 h-5" />
                <span>{client.phone}</span>
              </a>
            )}

            {client.address && (
              <div className="flex items-start gap-3 text-neutral-600 dark:text-neutral-400">
                <MapPin className="w-5 h-5 mt-0.5" />
                <span>{client.address}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Notes */}
        {client.notes && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-soft border border-neutral-200 dark:border-neutral-700"
          >
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <StickyNote className="w-5 h-5" />
              Notatki
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
              {client.notes}
            </p>
          </motion.div>
        )}

        {/* Reservations History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-soft border border-neutral-200 dark:border-neutral-700"
        >
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            Historia rezerwacji
          </h2>

          {!hasReservations ? (
            <div className="text-center py-12">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-700 mb-4">
                <Calendar className="h-8 w-8 text-neutral-400" />
              </div>
              <p className="text-neutral-600 dark:text-neutral-400">
                Brak rezerwacji dla tego klienta
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {client.reservations!.map((reservation) => (
                <Link
                  key={reservation.id}
                  href={`/dashboard/reservations/${reservation.id}`}
                  className="block group"
                >
                  <div className="rounded-xl bg-neutral-50 dark:bg-neutral-700/50 p-4 border border-neutral-200 dark:border-neutral-600 hover:border-primary-500 dark:hover:border-primary-500 transition-all hover:shadow-soft">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                            {formatDate(reservation.startDateTime)}
                          </p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[reservation.status]}`}>
                            {statusLabels[reservation.status]}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                          {reservation.eventType && (
                            <span>{reservation.eventType.name}</span>
                          )}
                          {reservation.hall && (
                            <span>• {reservation.hall.name}</span>
                          )}
                          {reservation.guests > 0 && (
                            <span>• {reservation.guests} osób</span>
                          )}
                          {reservation.totalPrice > 0 && (
                            <span className="font-medium text-neutral-900 dark:text-neutral-100">
                              • {reservation.totalPrice.toLocaleString('pl-PL')} zł
                            </span>
                          )}
                        </div>
                      </div>

                      <ExternalLink className="w-5 h-5 text-neutral-400 group-hover:text-primary-500 transition-colors flex-shrink-0" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
