import { apiClient } from '../api-client'
import { Client, ClientContact, ClientType, CreateClientInput, CreateClientContactInput, PaginatedResponse, Reservation } from '@/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// Re-export types for convenience
export type { Client, ClientContact, CreateClientInput, CreateClientContactInput, Reservation }

export interface ClientsFilters {
  page?: number
  pageSize?: number
  search?: string
  clientType?: ClientType
  includeDeleted?: boolean
}

export interface ClientWithReservations extends Client {
  reservations?: Reservation[]
  _count?: {
    reservations: number
  }
}

export interface ClientReservationSummary {
  active: number
  completed: number
  cancelled: number
  archived: number
  total: number
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

  // Get reservation summary for a client (used before delete)
  getReservationSummary: async (id: string): Promise<ClientReservationSummary> => {
    const { data } = await apiClient.get(`/clients/${id}/reservation-summary`)
    return data.data || data
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

  // Delete client (soft-delete with anonymization)
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/clients/${id}`)
  },
}

// ========================================
// CONTACTS API FUNCTIONS
// ========================================

export const contactsApi = {
  // Get all contacts for a client
  getAll: async (clientId: string): Promise<ClientContact[]> => {
    const { data } = await apiClient.get(`/clients/${clientId}/contacts`)
    if (data.success && data.data) return data.data
    return Array.isArray(data) ? data : []
  },

  // Add a contact to a client
  add: async (clientId: string, input: CreateClientContactInput): Promise<ClientContact> => {
    const { data } = await apiClient.post(`/clients/${clientId}/contacts`, input)
    return data.data || data
  },

  // Update a contact
  update: async (clientId: string, contactId: string, input: Partial<CreateClientContactInput>): Promise<ClientContact> => {
    const { data } = await apiClient.put(`/clients/${clientId}/contacts/${contactId}`, input)
    return data.data || data
  },

  // Remove a contact
  remove: async (clientId: string, contactId: string): Promise<void> => {
    await apiClient.delete(`/clients/${clientId}/contacts/${contactId}`)
  },
}

// ========================================
// DIRECT API EXPORTS (for non-hook usage)
// ========================================

export const getClients = (filters?: ClientsFilters) => clientsApi.getAll(filters)
export const getClientById = (id: string) => clientsApi.getById(id)
export const getClientReservationSummary = (id: string) => clientsApi.getReservationSummary(id)
export const createClient = (input: CreateClientInput) => clientsApi.create(input)
export const updateClient = (id: string, input: Partial<CreateClientInput>) => clientsApi.update(id, input)
export const deleteClient = (id: string) => clientsApi.delete(id)

export const getClientContacts = (clientId: string) => contactsApi.getAll(clientId)
export const addClientContact = (clientId: string, input: CreateClientContactInput) => contactsApi.add(clientId, input)
export const updateClientContact = (clientId: string, contactId: string, input: Partial<CreateClientContactInput>) => contactsApi.update(clientId, contactId, input)
export const removeClientContact = (clientId: string, contactId: string) => contactsApi.remove(clientId, contactId)

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
  contacts: (clientId: string) => [...clientsKeys.detail(clientId), 'contacts'] as const,
}

// GET ALL CLIENTS
export const useClients = (search?: string, clientType?: ClientType) => {
  return useQuery({
    queryKey: clientsKeys.list({ search, clientType }),
    queryFn: () => clientsApi.getAll({ search, clientType }),
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

// GET CLIENT CONTACTS
export const useClientContacts = (clientId: string) => {
  return useQuery({
    queryKey: clientsKeys.contacts(clientId),
    queryFn: () => contactsApi.getAll(clientId),
    enabled: !!clientId,
    staleTime: 60_000,
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
      
      toast.success('Dane klienta zostały zanonimizowane')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Błąd podczas usuwania klienta'
      toast.error(errorMessage)
    },
  })
}

// ADD CONTACT
export const useAddContact = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clientId, data }: { clientId: string; data: CreateClientContactInput }) =>
      contactsApi.add(clientId, data),
    onSuccess: (_, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: clientsKeys.detail(clientId) })
      queryClient.invalidateQueries({ queryKey: clientsKeys.contacts(clientId) })
      toast.success('Kontakt dodany pomyślnie!')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Błąd podczas dodawania kontaktu'
      toast.error(errorMessage)
    },
  })
}

// UPDATE CONTACT
export const useUpdateContact = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clientId, contactId, data }: { clientId: string; contactId: string; data: Partial<CreateClientContactInput> }) =>
      contactsApi.update(clientId, contactId, data),
    onSuccess: (_, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: clientsKeys.detail(clientId) })
      queryClient.invalidateQueries({ queryKey: clientsKeys.contacts(clientId) })
      toast.success('Kontakt zaktualizowany!')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Błąd podczas aktualizacji kontaktu'
      toast.error(errorMessage)
    },
  })
}

// REMOVE CONTACT
export const useRemoveContact = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clientId, contactId }: { clientId: string; contactId: string }) =>
      contactsApi.remove(clientId, contactId),
    onSuccess: (_, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: clientsKeys.detail(clientId) })
      queryClient.invalidateQueries({ queryKey: clientsKeys.contacts(clientId) })
      toast.success('Kontakt usunięty!')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Błąd podczas usuwania kontaktu'
      toast.error(errorMessage)
    },
  })
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Normalize phone number for duplicate detection
export const normalizePhone = (phone: string): string => {
  // Remove spaces, hyphens, and parentheses
  return phone.replace(/\s/g, '').replace(/-/g, '').replace(/\(/g, '').replace(/\)/g, '')
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
