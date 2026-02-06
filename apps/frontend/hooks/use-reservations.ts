import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { reservationsApi, ReservationsFilters } from '@/lib/api/reservations'
import {
  Reservation,
  CreateReservationInput,
  UpdateReservationInput,
  CancelReservationInput,
} from '@/types'

export function useReservations(filters?: ReservationsFilters) {
  return useQuery({
    queryKey: ['reservations', filters],
    queryFn: () => reservationsApi.getAll(filters),
  })
}

export function useReservation(id: string) {
  return useQuery({
    queryKey: ['reservations', id],
    queryFn: () => reservationsApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateReservationInput) => reservationsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      toast.success('Rezerwacja została utworzona')
    },
    onError: () => {
      toast.error('Nie udało się utworzyć rezerwacji')
    },
  })
}

export function useUpdateReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateReservationInput }) =>
      reservationsApi.update(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      queryClient.invalidateQueries({ queryKey: ['reservations', data.id] })
      toast.success('Rezerwacja została zaktualizowana')
    },
    onError: () => {
      toast.error('Nie udało się zaktualizować rezerwacji')
    },
  })
}

export function useCancelReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CancelReservationInput }) =>
      reservationsApi.cancel(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      toast.success('Rezerwacja została anulowana')
    },
    onError: () => {
      toast.error('Nie udało się anulować rezerwacji')
    },
  })
}

export function useArchiveReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => reservationsApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      toast.success('Rezerwacja została zarchiwizowana')
    },
    onError: () => {
      toast.error('Nie udało się zarchiwizować rezerwacji')
    },
  })
}
