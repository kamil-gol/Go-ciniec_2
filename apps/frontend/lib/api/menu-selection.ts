/**
 * Menu Selection API
 * 
 * Frontend API methods for reservation menu management
 */

import { apiClient } from '@/lib/api-client';
import {
  MenuSelectionInput,
  ReservationMenuResponse,
  ApiResponse,
} from '@/types/menu.types';

/**
 * Select menu for reservation
 * POST /api/reservations/:id/menu
 */
export async function selectReservationMenu(
  reservationId: string,
  input: MenuSelectionInput
): Promise<ReservationMenuResponse> {
  const response = await apiClient.post<ApiResponse<ReservationMenuResponse>>(
    `/reservations/${reservationId}/menu`,
    input
  );
  return response.data.data;
}

/**
 * Get menu for reservation
 * GET /api/reservations/:id/menu
 */
export async function getReservationMenu(
  reservationId: string
): Promise<ReservationMenuResponse> {
  const response = await apiClient.get<ApiResponse<ReservationMenuResponse>>(
    `/reservations/${reservationId}/menu`
  );
  return response.data.data;
}

/**
 * Update menu for reservation
 * PUT /api/reservations/:id/menu
 */
export async function updateReservationMenu(
  reservationId: string,
  input: MenuSelectionInput
): Promise<ReservationMenuResponse> {
  const response = await apiClient.put<ApiResponse<ReservationMenuResponse>>(
    `/reservations/${reservationId}/menu`,
    input
  );
  return response.data.data;
}

/**
 * Delete menu from reservation
 * DELETE /api/reservations/:id/menu
 */
export async function deleteReservationMenu(
  reservationId: string
): Promise<void> {
  await apiClient.delete(`/reservations/${reservationId}/menu`);
}
