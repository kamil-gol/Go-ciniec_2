'use client'

import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  Loader2, 
  AlertCircle, 
  Edit, 
  Users,
  DollarSign,
  MapPin,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  PlayCircle,
  User,
  Building
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useReservation, useUpdateReservationStatus } from '@/lib/api/reservations'
import { ReservationStatus } from '@/types'
import { format, isValid, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import Link from 'next/link'
import { useState } from 'react'

const statusColors = {
  [ReservationStatus.PENDING]: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  [ReservationStatus.CONFIRMED]: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  [ReservationStatus.COMPLETED]: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  [ReservationStatus.CANCELLED]: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  [ReservationStatus.RESERVED]: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
}

const statusLabels = {
  [ReservationStatus.PENDING]: 'Oczekuj\u0105ca',
  [ReservationStatus.CONFIRMED]: 'Potwierdzona',
  [ReservationStatus.COMPLETED]: 'Zako\u0144czona',
  [ReservationStatus.CANCELLED]: 'Anulowana',
  [ReservationStatus.RESERVED]: 'W kolejce',
}

// Helper to safely format dates
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Brak daty'
  
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString)
    if (!isValid(date)) return 'Nieprawid\u0142owa data'
    return format(date, 'd MMMM yyyy', { locale: pl })
  } catch (error) {
    console.error('Error formatting date:', dateString, error)
    return 'B\u0142\u0105d daty'
  }
}

// Helper to format date with time
const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Brak daty'
  
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString)
    if (!isValid(date)) return 'Nieprawid\u0142owa data'
    return format(date, 'd MMMM yyyy, HH:mm', { locale: pl })
  } catch (error) {
    console.error('Error formatting date:', dateString, error)
    return 'B\u0142\u0105d daty'
  }
}

// Helper to format currency (cents to PLN)
const formatCurrency = (cents: number): string => {
  const zloty = cents / 100
  return zloty.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export default function ReservationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const reservationId = params.id as string

  const { data: reservation, isLoading, error } = useReservation(reservationId)
  const updateStatus = useUpdateReservationStatus()
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const handleStatusChange = async (newStatus: ReservationStatus) => {
    const confirmMessages = {
      [ReservationStatus.CONFIRMED]: 'Czy na pewno chcesz potwierdzi\u0107 t\u0119 rezerwacj\u0119?',
      [ReservationStatus.CANCELLED]: 'Czy na pewno chcesz anulowa\u0107 t\u0119 rezerwacj\u0119?',
      [ReservationStatus.COMPLETED]: 'Czy na pewno chcesz oznaczy\u0107 t\u0119 rezerwacj\u0119 jako zako\u0144czon\u0105?',
      [ReservationStatus.PENDING]: 'Czy na pewno chcesz zmieni\u0107 status na oczekuj\u0105cy?',
      [ReservationStatus.RESERVED]: 'Czy na pewno chcesz przenie\u015b\u0107 t\u0119 rezerwacj\u0119 do kolejki?',
    }

    if (!confirm(confirmMessages[newStatus])) return

    setIsUpdatingStatus(true)
    try {
      await updateStatus.mutateAsync({
        id: reservationId,
        status: newStatus,
        reason: `Status zmieniony na: ${statusLabels[newStatus]}`
      })
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Wyst\u0105pi\u0142 b\u0142\u0105d podczas zmiany statusu')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Get display date based on status
  const getDisplayDate = () => {
    if (!reservation) return 'Brak daty'
    if (reservation.status === ReservationStatus.RESERVED) {
      return formatDate(reservation.reservationQueueDate)
    }
    return formatDateTime(reservation.startDateTime)
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">
            \u0141adowanie danych rezerwacji...
          </p>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !reservation) {
    return (
      <DashboardLayout>
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-8 text-center border border-red-200 dark:border-red-800">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">
            B\u0142\u0105d \u0142adowania rezerwacji
          </h3>
          <p className="text-red-700 dark:text-red-300 mb-4">
            {error instanceof Error ? error.message : 'Rezerwacja nie zosta\u0142a znaleziona'}
          </p>
          <button
            onClick={() => router.push('/dashboard/reservations')}
            className="px-6 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Powr\u00f3t do listy rezerwacji
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
            Powr\u00f3t
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                  Rezerwacja #{reservation.id}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[reservation.status]}`}>
                  {statusLabels[reservation.status]}
                </span>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400">
                {getDisplayDate()}
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/dashboard/reservations/${reservationId}/edit`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edytuj
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Status Actions */}
        {reservation.status !== ReservationStatus.COMPLETED && reservation.status !== ReservationStatus.CANCELLED && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-soft border border-neutral-200 dark:border-neutral-700"
          >
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              Akcje
            </h2>
            <div className="flex flex-wrap gap-3">
              {reservation.status === ReservationStatus.PENDING && (
                <button
                  onClick={() => handleStatusChange(ReservationStatus.CONFIRMED)}
                  disabled={isUpdatingStatus}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Potwierd\u017a
                </button>
              )}
              
              {reservation.status === ReservationStatus.CONFIRMED && (
                <button
                  onClick={() => handleStatusChange(ReservationStatus.COMPLETED)}
                  disabled={isUpdatingStatus}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Oznacz jako zako\u0144czon\u0105
                </button>
              )}
              
              {reservation.status === ReservationStatus.RESERVED && (
                <button
                  onClick={() => handleStatusChange(ReservationStatus.CONFIRMED)}
                  disabled={isUpdatingStatus}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
                >
                  <PlayCircle className="w-4 h-4" />
                  Potwierd\u017a z kolejki
                </button>
              )}
              
              <button
                onClick={() => handleStatusChange(ReservationStatus.CANCELLED)}
                disabled={isUpdatingStatus}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Anuluj rezerwacj\u0119
              </button>
            </div>
          </motion.div>
        )}

        {/* Basic Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-soft border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Liczba go\u015bci
              </p>
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {reservation.guests || 0}
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-soft border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Ca\u0142kowita cena
              </p>
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {formatCurrency(reservation.totalPrice || 0)} z\u0142
            </p>
          </div>

          {reservation.hall && (
            <div className="rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-soft border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <Building className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Sala
                </p>
              </div>
              <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {reservation.hall.name}
              </p>
            </div>
          )}

          {reservation.eventType && (
            <div className="rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-soft border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                  <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Rodzaj wydarzenia
                </p>
              </div>
              <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {reservation.eventType.name}
              </p>
            </div>
          )}
        </motion.div>

        {/* Client Info */}
        {reservation.client && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-soft border border-neutral-200 dark:border-neutral-700"
          >
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Klient
            </h2>
            
            <div className="space-y-3">
              <Link
                href={`/dashboard/clients/${reservation.client.id}`}
                className="block text-lg font-semibold text-primary-600 dark:text-primary-400 hover:underline"
              >
                {reservation.client.firstName} {reservation.client.lastName}
              </Link>

              <div className="space-y-2">
                {reservation.client.email && (
                  <a
                    href={`mailto:${reservation.client.email}`}
                    className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{reservation.client.email}</span>
                  </a>
                )}

                {reservation.client.phone && (
                  <a
                    href={`tel:${reservation.client.phone}`}
                    className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>{reservation.client.phone}</span>
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Notes */}
        {reservation.notes && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-soft border border-neutral-200 dark:border-neutral-700"
          >
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Notatki
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
              {reservation.notes}
            </p>
          </motion.div>
        )}

        {/* Additional Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-soft border border-neutral-200 dark:border-neutral-700"
        >
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            Szczeg\u00f3\u0142y
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {reservation.startDateTime && reservation.status !== ReservationStatus.RESERVED && (
              <div>
                <p className="text-neutral-500 dark:text-neutral-400 mb-1">Data rozpocz\u0119cia</p>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {formatDateTime(reservation.startDateTime)}
                </p>
              </div>
            )}

            {reservation.endDateTime && reservation.status !== ReservationStatus.RESERVED && (
              <div>
                <p className="text-neutral-500 dark:text-neutral-400 mb-1">Data zako\u0144czenia</p>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {formatDateTime(reservation.endDateTime)}
                </p>
              </div>
            )}

            {reservation.status === ReservationStatus.RESERVED && reservation.reservationQueueDate && (
              <div>
                <p className="text-neutral-500 dark:text-neutral-400 mb-1">Preferowana data (kolejka)</p>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {formatDate(reservation.reservationQueueDate)}
                </p>
              </div>
            )}

            <div>
              <p className="text-neutral-500 dark:text-neutral-400 mb-1">Data utworzenia</p>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                {formatDateTime(reservation.createdAt)}
              </p>
            </div>

            <div>
              <p className="text-neutral-500 dark:text-neutral-400 mb-1">Ostatnia aktualizacja</p>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                {formatDateTime(reservation.updatedAt)}
              </p>
            </div>

            {reservation.duration && (
              <div>
                <p className="text-neutral-500 dark:text-neutral-400 mb-1">Czas trwania</p>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {reservation.duration} godzin
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
