import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { clientsApi, ClientsFilters } from '@/lib/api/clients'
import { Client, CreateClientInput } from '@/types'

export function useClients(filters?: ClientsFilters) {
  return useQuery({
    queryKey: ['clients', filters],
    queryFn: () => clientsApi.getAll(filters),
  })
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => clientsApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateClientInput) => clientsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Klient został utworzony')
    },
    onError: () => {
      toast.error('Nie udało się utworzyć klienta')
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateClientInput> }) =>
      clientsApi.update(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['clients', data.id] })
      toast.success('Klient został zaktualizowany')
    },
    onError: () => {
      toast.error('Nie udało się zaktualizować klienta')
    },
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Klient został usunięty')
    },
    onError: () => {
      toast.error('Nie udało się usunąć klienta')
    },
  })
}
