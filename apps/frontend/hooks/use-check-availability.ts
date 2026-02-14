import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export interface AvailabilityConflict {
  id: string
  clientName: string
  eventType: string
  startDateTime: string
  endDateTime: string
  status: string
}

export interface AvailabilityResult {
  available: boolean
  conflicts: AvailabilityConflict[]
}

async function checkAvailability(
  hallId: string,
  startDateTime: string,
  endDateTime: string,
  excludeReservationId?: string
): Promise<AvailabilityResult> {
  const params = new URLSearchParams({
    hallId,
    startDateTime,
    endDateTime,
  })
  if (excludeReservationId) {
    params.append('excludeReservationId', excludeReservationId)
  }
  // apiClient.baseURL already includes /api, so use relative path
  const response = await apiClient.get(`/reservations/check-availability?${params.toString()}`)
  // Backend returns { success, data: { available, conflicts } } — unwrap envelope
  return response.data?.data ?? response.data
}

/**
 * Hook to check hall availability for a given time range.
 * Only fires when all three params are provided.
 */
export function useCheckAvailability(
  hallId: string | undefined,
  startDateTime: string | undefined,
  endDateTime: string | undefined,
  excludeReservationId?: string
) {
  return useQuery({
    queryKey: ['check-availability', hallId, startDateTime, endDateTime, excludeReservationId],
    queryFn: () => checkAvailability(hallId!, startDateTime!, endDateTime!, excludeReservationId),
    enabled: Boolean(hallId && startDateTime && endDateTime),
    staleTime: 30 * 1000, // 30s — re-check after half a minute
    retry: false,
  })
}
