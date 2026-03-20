import { useQuery } from '@tanstack/react-query'
import { searchApi } from '@/lib/api/search'

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ['global-search', query],
    queryFn: () => searchApi.globalSearch(query),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
}
