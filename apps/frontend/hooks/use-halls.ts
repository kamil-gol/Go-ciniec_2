import { useQuery } from '@tanstack/react-query'
import { hallsApi } from '@/lib/api/halls'

export function useHalls() {
  return useQuery({
    queryKey: ['halls'],
    queryFn: () => hallsApi.getAll(),
  })
}

export function useHall(id: string) {
  return useQuery({
    queryKey: ['halls', id],
    queryFn: () => hallsApi.getById(id),
    enabled: !!id,
  })
}

/**
 * #165: Check available capacity for a hall in a given time range.
 * Used in the reservation form to validate guest count against remaining capacity
 * when the hall allows multiple bookings.
 */
export function useAvailableCapacity(
  hallId: string | undefined,
  startDateTime: string | undefined,
  endDateTime: string | undefined,
  excludeReservationId?: string
) {
  return useQuery({
    queryKey: ['hall-available-capacity', hallId, startDateTime, endDateTime, excludeReservationId],
    queryFn: () => hallsApi.getAvailableCapacity(hallId!, startDateTime!, endDateTime!, excludeReservationId),
    enabled: Boolean(hallId && startDateTime && endDateTime),
    staleTime: 30 * 1000,
    retry: false,
  })
}
