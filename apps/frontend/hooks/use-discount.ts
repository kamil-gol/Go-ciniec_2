import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { MutationError } from '@/types/common.types'
import { toast } from 'sonner'
import { discountApi, ApplyDiscountInput } from '@/lib/api/discount'

export function useApplyDiscount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ApplyDiscountInput }) =>
      discountApi.apply(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      queryClient.invalidateQueries({ queryKey: ['reservations', variables.id] })
      toast.success('Rabat został zastosowany')
    },
    onError: (error: MutationError) => {
      const msg = error?.response?.data?.message || 'Nie udało się zastosować rabatu'
      toast.error(msg)
    },
  })
}

export function useRemoveDiscount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => discountApi.remove(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      queryClient.invalidateQueries({ queryKey: ['reservations', data.id] })
      toast.success('Rabat został usunięty')
    },
    onError: (error: MutationError) => {
      const msg = error?.response?.data?.message || 'Nie udało się usunąć rabatu'
      toast.error(msg)
    },
  })
}
