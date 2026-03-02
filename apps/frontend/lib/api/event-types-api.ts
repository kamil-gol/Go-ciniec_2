/**
 * Event Types API Client
 * Full CRUD + stats + colors
 */

import { apiClient } from '@/lib/api-client';

// ─── Types ───────────────────────────────────────────────────

export interface EventType {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
  standardHours: number | null;
  extraHourRate: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventTypeWithCounts extends EventType {
  _count: {
    reservations: number;
    menuTemplates: number;
  };
}

export interface EventTypeStats {
  id: string;
  name: string;
  color: string | null;
  isActive: boolean;
  reservationCount: number;
  menuTemplateCount: number;
}

export interface CreateEventTypeData {
  name: string;
  description?: string;
  color?: string;
  isActive?: boolean;
  standardHours?: number;
  extraHourRate?: number;
}

export interface UpdateEventTypeData {
  name?: string;
  description?: string | null;
  color?: string | null;
  isActive?: boolean;
  standardHours?: number | null;
  extraHourRate?: number | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

// ─── API Functions ───────────────────────────────────────────

/**
 * Get all event types
 */
export async function getEventTypes(activeOnly: boolean = false): Promise<EventType[]> {
  const query = activeOnly ? '?isActive=true' : '';
  const { data } = await apiClient.get<ApiResponse<EventType[]>>(`/event-types${query}`);
  return data.data;
}

/**
 * Get single event type by ID (includes reservation/template counts)
 */
export async function getEventTypeById(id: string): Promise<EventTypeWithCounts> {
  const { data } = await apiClient.get<ApiResponse<EventTypeWithCounts>>(`/event-types/${id}`);
  return data.data;
}

/**
 * Create a new event type
 */
export async function createEventType(payload: CreateEventTypeData): Promise<EventType> {
  const { data } = await apiClient.post<ApiResponse<EventType>>('/event-types', payload);
  return data.data;
}

/**
 * Update an existing event type
 */
export async function updateEventType(id: string, payload: UpdateEventTypeData): Promise<EventType> {
  const { data } = await apiClient.put<ApiResponse<EventType>>(`/event-types/${id}`, payload);
  return data.data;
}

/**
 * Delete an event type (fails if it has reservations or menu templates)
 */
export async function deleteEventType(id: string): Promise<void> {
  await apiClient.delete(`/event-types/${id}`);
}

/**
 * Get stats for all event types (reservation + template counts)
 */
export async function getEventTypeStats(): Promise<EventTypeStats[]> {
  const { data } = await apiClient.get<ApiResponse<EventTypeStats[]>>('/event-types/stats');
  return data.data;
}

/**
 * Get predefined colors for color picker
 */
export async function getPredefinedColors(): Promise<string[]> {
  const { data } = await apiClient.get<ApiResponse<string[]>>('/event-types/colors');
  return data.data;
}
