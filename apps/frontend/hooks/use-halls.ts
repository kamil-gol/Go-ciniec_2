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
