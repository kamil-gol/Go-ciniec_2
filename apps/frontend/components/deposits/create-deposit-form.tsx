'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { depositsApi } from '@/lib/api/deposits'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { Loader2, Save, X } from 'lucide-react'

interface Reservation {
  id: string
  date: string
  startTime: string
  endTime: string
  guests: number
  totalPrice: string
  status: string
  client: {
    firstName: string
    lastName: string
  }
  hall: {
    name: string
  }
  eventType: {
    name: string
  }
}

interface CreateDepositFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function CreateDepositForm({ onSuccess, onCancel }: CreateDepositFormProps) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loadingReservations, setLoadingReservations] = useState(true)
  const [selectedReservationId, setSelectedReservationId] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [title, setTitle] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadReservations()
  }, [])

  const loadReservations = async () => {
    try {
      setLoadingReservations(true)
      const response = await apiClient.get('/reservations')
      const data = response.data.data || response.data
      const today = new Date().toISOString().split('T')[0]
      const active = Array.isArray(data)
        ? data.filter((r: Reservation) => {
            const isActiveStatus = ['CONFIRMED', 'PENDING', 'COMPLETED'].includes(r.status)
            const isFutureOrToday = r.date >= today
            return isActiveStatus && isFutureOrToday
          })
        : []
      active.sort((a: Reservation, b: Reservation) => a.date.localeCompare(b.date))
      setReservations(active)
    } catch (error) {
      console.error('Error loading reservations:', error)
    } finally {
      setLoadingReservations(false)
    }
  }

  const selectedReservation = reservations.find(r => r.id === selectedReservationId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedReservationId) {
      toast.error('Wybierz rezerwację')
      return
    }
    if (!amount || Number(amount) <= 0) {
      toast.error('Podaj prawidłową kwotę')
      return
    }
    if (!dueDate) {
      toast.error('Podaj termin płatności')
      return
    }

    try {
      setSubmitting(true)
      await depositsApi.create(selectedReservationId, {
        amount: Number(amount),
        dueDate,
        title: title || undefined,
        internalNotes: internalNotes || undefined,
      })
      toast.success('Zaliczka została utworzona')
      onSuccess()
    } catch (error) {
      console.error('Error creating deposit:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reservation Select */}
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="reservation">Rezerwacja *</Label>
          {loadingReservations ? (
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Ładowanie rezerwacji...
            </div>
          ) : reservations.length === 0 ? (
            <p className="text-sm text-neutral-500">Brak przyszłych rezerwacji do przypisania zaliczki.</p>
          ) : (
            <select
              id="reservation"
              value={selectedReservationId}
              onChange={(e) => setSelectedReservationId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Wybierz rezerwację...</option>
              {reservations.map((r) => (
                <option key={r.id} value={r.id}>
                  {formatDate(r.date)} — {r.client.firstName} {r.client.lastName} — {r.hall.name} ({r.eventType.name}) — {Number(r.totalPrice).toLocaleString('pl-PL')} zł
                </option>
              ))}
            </select>
          )}
          {selectedReservation && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-sm">
              <p className="text-blue-800 dark:text-blue-300">
                Rezerwacja: <strong>{selectedReservation.client.firstName} {selectedReservation.client.lastName}</strong>,{' '}
                {selectedReservation.hall.name}, {formatDate(selectedReservation.date)},{' '}
                {selectedReservation.startTime}–{selectedReservation.endTime},{' '}
                {selectedReservation.guests} gości,{' '}
                cena: {Number(selectedReservation.totalPrice).toLocaleString('pl-PL')} zł
              </p>
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Kwota zaliczki (zł) *</Label>
          <Input
            id="amount"
            type="number"
            min="1"
            step="0.01"
            placeholder="np. 500"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {selectedReservation && amount && (
            <p className="text-xs text-neutral-500">
              {((Number(amount) / Number(selectedReservation.totalPrice)) * 100).toFixed(1)}% ceny rezerwacji
            </p>
          )}
        </div>

        {/* Due Date */}
        <div className="space-y-2">
          <Label htmlFor="dueDate">Termin płatności *</Label>
          <Input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Tytuł (opcjonalnie)</Label>
          <Input
            id="title"
            placeholder="np. Zaliczka na wesele"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Internal Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notatki wewnętrzne</Label>
          <Textarea
            id="notes"
            placeholder="Notatki widoczne tylko dla admina..."
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Anuluj
        </Button>
        <Button type="submit" disabled={submitting} className="bg-rose-600 hover:bg-rose-700">
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Utwórz Zaliczkę
        </Button>
      </div>
    </form>
  )
}
