import { apiClient } from '../api-client'
import { Client, CreateClientInput, PaginatedResponse, Reservation } from '@/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export interface ClientsFilters {
  page?: number
  pageSize?: number
  search?: string
}

export interface ClientWithReservations extends Client {
  reservations?: Reservation[]
  _count?: {
    reservations: number
  }
}

// ========================================
// API FUNCTIONS
// ========================================

export const clientsApi = {
  // Get all clients with filters
  getAll: async (filters: ClientsFilters = {}): Promise<Client[]> => {
    console.log('Fetching clients with filters:', filters)
    const { data } = await apiClient.get('/clients', { params: filters })
    console.log('Raw clients response:', data)
    
    // Backend returns: { success: true, data: [...], count: 8 }
    if (data.success && data.data) {
      console.log('Parsed clients result:', data.data)
      return data.data
    }
    
    // Fallback for direct data array
    console.warn('Unexpected response format, using fallback')
    return Array.isArray(data) ? data : []
  },

  // Get single client by ID with reservations
  getById: async (id: string): Promise<ClientWithReservations> => {
    const { data } = await apiClient.get(`/clients/${id}`)
    return data.data || data // Handle both structures
  },

  // Create new client
  create: async (input: CreateClientInput): Promise<Client> => {
    const { data } = await apiClient.post('/clients', input)
    return data.data || data // Handle both structures
  },

  // Update client (backend uses PUT)
  update: async (id: string, input: Partial<CreateClientInput>): Promise<Client> => {
    const { data } = await apiClient.put(`/clients/${id}`, input)
    return data.data || data // Handle both structures
  },

  // Delete client
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/clients/${id}`)
  },
}

// ========================================
// REACT QUERY HOOKS
// ========================================

// Query Keys
export const clientsKeys = {
  all: ['clients'] as const,
  lists: () => [...clientsKeys.all, 'list'] as const,
  list: (filters: ClientsFilters) => [...clientsKeys.lists(), filters] as const,
  details: () => [...clientsKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientsKeys.details(), id] as const,
}

// GET ALL CLIENTS
export const useClients = (search?: string) => {
  return useQuery({
    queryKey: clientsKeys.list({ search }),
    queryFn: () => clientsApi.getAll({ search }),
    staleTime: 30_000, // 30 seconds
    refetchOnWindowFocus: true,
  })
}

// GET SINGLE CLIENT
export const useClient = (id: string) => {
  return useQuery({
    queryKey: clientsKeys.detail(id),
    queryFn: () => clientsApi.getById(id),
    enabled: !!id,
    staleTime: 60_000, // 1 minute
  })
}

// CREATE CLIENT
export const useCreateClient = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateClientInput) => clientsApi.create(input),
    onSuccess: (newClient) => {
      // Invalidate all client lists
      queryClient.invalidateQueries({ queryKey: clientsKeys.lists() })
      
      // Add to cache
      queryClient.setQueryData(clientsKeys.detail(newClient.id), newClient)
      
      toast.success('Klient dodany pomyślnie!')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Błąd podczas dodawania klienta'
      toast.error(errorMessage)
    },
  })
}

// UPDATE CLIENT
export const useUpdateClient = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateClientInput> }) =>
      clientsApi.update(id, data),
    onSuccess: (updatedClient) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: clientsKeys.lists() })
      
      // Update detail cache
      queryClient.setQueryData(clientsKeys.detail(updatedClient.id), updatedClient)
      
      toast.success('Klient zaktualizowany pomyślnie!')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Błąd podczas aktualizacji klienta'
      toast.error(errorMessage)
    },
  })
}

// DELETE CLIENT
export const useDeleteClient = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: clientsKeys.lists() })
      
      // Remove from cache
      queryClient.removeQueries({ queryKey: clientsKeys.detail(deletedId) })
      
      toast.success('Klient usunięty pomyślnie!')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Błąd podczas usuwania klienta'
      toast.error(errorMessage)
    },
  })
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Normalize phone number for duplicate detection
export const normalizePhone = (phone: string): string => {
  return phone.replace(/[\\s\\-()]/g, '')
}

// Check if phone number already exists
export const checkPhoneDuplicate = (
  phone: string,
  allClients: Client[],
  excludeId?: string
): Client | null => {
  if (!phone || phone.length < 9) return null

  const normalizedInput = normalizePhone(phone)

  const duplicate = allClients.find((client) => {
    if (excludeId && client.id === excludeId) return false // Skip self
    if (!client.phone) return false

    const normalizedExisting = normalizePhone(client.phone)
    return normalizedExisting === normalizedInput
  })

  return duplicate || null
}
