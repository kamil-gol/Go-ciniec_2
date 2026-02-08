import { apiClient } from '../api-client'
import {
  QueueItem,
  CreateQueueReservationInput,
  PromoteQueueReservationInput,
  QueueStats,
  Reservation,
} from '@/types'

export interface SwapQueuePositionsInput {
  reservationId1: string
  reservationId2: string
}

export interface MoveQueuePositionInput {
  reservationId: string
  newPosition: number
}

export interface UpdateQueueReservationInput {
  clientId?: string
  reservationQueueDate?: string
  guests?: number
  notes?: string
}

export interface RebuildPositionsResult {
  updatedCount: number
  dateCount: number
}

export const queueApi = {
  // Get all queues (all dates)
  getAll: async (): Promise<QueueItem[]> => {
    const { data } = await apiClient.get('/queue')
    console.log('Raw queue getAll response:', data)
    return data.data || data || []
  },

  // Get queue for specific date
  getByDate: async (date: string): Promise<QueueItem[]> => {
    const { data } = await apiClient.get(`/queue/${date}`)
    console.log('Raw queue getByDate response:', data)
    return data.data || data || []
  },

  // Get queue statistics
  getStats: async (): Promise<QueueStats> => {
    const { data } = await apiClient.get('/queue/stats')
    console.log('Raw queue stats response:', data)
    return data.data || data
  },

  // Add reservation to queue (create RESERVED)
  addToQueue: async (input: CreateQueueReservationInput): Promise<QueueItem> => {
    const { data } = await apiClient.post('/queue/reserved', input)
    console.log('Raw queue addToQueue response:', data)
    return data.data || data
  },

  // Update queue reservation
  updateQueueReservation: async (
    reservationId: string,
    input: UpdateQueueReservationInput
  ): Promise<QueueItem> => {
    const { data } = await apiClient.put(`/queue/${reservationId}`, input)
    console.log('Raw queue update response:', data)
    return data.data || data
  },

  // Swap two queue positions
  swapPositions: async (input: SwapQueuePositionsInput): Promise<void> => {
    await apiClient.post('/queue/swap', input)
  },

  // Move reservation to specific position
  moveToPosition: async (reservationId: string, newPosition: number): Promise<void> => {
    await apiClient.put(`/queue/${reservationId}/position`, { newPosition })
  },

  // Rebuild all queue positions (renumber per date)
  rebuildPositions: async (): Promise<RebuildPositionsResult> => {
    const { data } = await apiClient.post('/queue/rebuild-positions')
    console.log('Raw queue rebuildPositions response:', data)
    return data.data || data
  },

  // Promote RESERVED to PENDING/CONFIRMED
  promoteReservation: async (
    reservationId: string,
    input: PromoteQueueReservationInput
  ): Promise<Reservation> => {
    const { data } = await apiClient.put(`/queue/${reservationId}/promote`, input)
    console.log('Raw queue promote response:', data)
    return data.data || data
  },

  // Manually trigger auto-cancel expired reservations
  autoCancelExpired: async (): Promise<{ cancelledCount: number; cancelledIds: string[] }> => {
    const { data } = await apiClient.post('/queue/auto-cancel')
    console.log('Raw queue auto-cancel response:', data)
    return data.data || data
  },
}
