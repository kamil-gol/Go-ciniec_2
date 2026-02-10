/**
 * Event Types API Client
 */

import { apiClient } from '@/lib/api-client';

export interface EventType {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Get all event types
 */
export async function getEventTypes(activeOnly: boolean = true): Promise<EventType[]> {
  const query = activeOnly ? '?isActive=true' : '';
  const { data } = await apiClient.get<ApiResponse<EventType[]>>(`/event-types${query}`);
  return data.data;
}

/**
 * Get single event type by ID
 */
export async function getEventTypeById(id: string): Promise<EventType> {
  const { data } = await apiClient.get<ApiResponse<EventType>>(`/event-types/${id}`);
  return data.data;
}
