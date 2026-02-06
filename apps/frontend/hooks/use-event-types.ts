import { useQuery } from '@tanstack/react-query'
import { eventTypesApi } from '@/lib/api/event-types'

export function useEventTypes() {
  return useQuery({
    queryKey: ['event-types'],
    queryFn: () => eventTypesApi.getAll(),
  })
}
