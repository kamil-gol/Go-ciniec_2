/**
 * Queue Validation Schemas (Zod)
 * Validation for queue management endpoints
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// Shared
// ═══════════════════════════════════════════════════════════════

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

// ═══════════════════════════════════════════════════════════════
// Add to Queue (POST /api/queue/reserved)
// ═══════════════════════════════════════════════════════════════

export const addToQueueSchema = z.object({
  clientId: z.string().uuid('clientId musi być UUID'),
  reservationQueueDate: z.string().regex(datePattern, 'Format daty: YYYY-MM-DD'),
  guests: z.number().int().min(1, 'Minimalna liczba gości: 1'),
  adults: z.number().int().min(0).optional(),
  children: z.number().int().min(0).optional(),
  toddlers: z.number().int().min(0).optional(),
  notes: z.string().max(5000, 'Notatki max 5000 znaków').optional().nullable(),
});

// ═══════════════════════════════════════════════════════════════
// Update Queue Reservation (PUT /api/queue/:id)
// ═══════════════════════════════════════════════════════════════

export const updateQueueReservationSchema = z.object({
  guests: z.number().int().min(1, 'Minimalna liczba gości: 1').optional(),
  adults: z.number().int().min(0).optional(),
  children: z.number().int().min(0).optional(),
  toddlers: z.number().int().min(0).optional(),
  notes: z.string().max(5000, 'Notatki max 5000 znaków').optional().nullable(),
  reservationQueueDate: z
    .string()
    .regex(datePattern, 'Format daty: YYYY-MM-DD')
    .optional(),
});

// ═══════════════════════════════════════════════════════════════
// Swap Positions (POST /api/queue/swap)
// ═══════════════════════════════════════════════════════════════

export const swapPositionsSchema = z.object({
  reservationId1: z.string().uuid('reservationId1 musi być UUID'),
  reservationId2: z.string().uuid('reservationId2 musi być UUID'),
});

// ═══════════════════════════════════════════════════════════════
// Move to Position (PUT /api/queue/:id/position)
// ═══════════════════════════════════════════════════════════════

export const moveToPositionSchema = z.object({
  newPosition: z.number().int().min(1, 'Pozycja musi być >= 1'),
});

// ═══════════════════════════════════════════════════════════════
// Batch Update Positions (POST /api/queue/batch-update-positions)
// ═══════════════════════════════════════════════════════════════

export const batchUpdatePositionsSchema = z.object({
  updates: z
    .array(
      z.object({
        id: z.string().uuid('id musi być UUID'),
        position: z.number().int().min(1, 'Pozycja musi być >= 1'),
      })
    )
    .min(1, 'Lista aktualizacji nie może być pusta'),
});

// ═══════════════════════════════════════════════════════════════
// Promote Reservation (PUT /api/queue/:id/promote)
// ═══════════════════════════════════════════════════════════════

export const promoteReservationSchema = z.object({
  hallId: z.string().uuid('hallId musi być UUID'),
  eventTypeId: z.string().uuid('eventTypeId musi być UUID'),
  startDateTime: z.string().datetime({ message: 'Nieprawidłowy format ISO 8601 dla startDateTime' }),
  endDateTime: z.string().datetime({ message: 'Nieprawidłowy format ISO 8601 dla endDateTime' }),
  adults: z.number().int().min(1, 'Wymagany min. 1 dorosły'),
  children: z.number().int().min(0).optional(),
  toddlers: z.number().int().min(0).optional(),
  pricePerAdult: z.number().positive('Cena za dorosłego musi być > 0'),
  pricePerChild: z.number().min(0).optional(),
  pricePerToddler: z.number().min(0).optional(),
  status: z.enum(['PENDING', 'CONFIRMED']),
  notes: z.string().max(5000).optional().nullable(),
  customEventType: z.string().max(255).optional().nullable(),
  birthdayAge: z.number().int().min(0).max(150).optional().nullable(),
  anniversaryYear: z.number().int().min(0).optional().nullable(),
  anniversaryOccasion: z.string().max(255).optional().nullable(),
});

// ═══════════════════════════════════════════════════════════════
// Inferred Types
// ═══════════════════════════════════════════════════════════════

export type AddToQueueInput = z.infer<typeof addToQueueSchema>;
export type UpdateQueueReservationInput = z.infer<typeof updateQueueReservationSchema>;
export type SwapPositionsInput = z.infer<typeof swapPositionsSchema>;
export type MoveToPositionInput = z.infer<typeof moveToPositionSchema>;
export type BatchUpdatePositionsInput = z.infer<typeof batchUpdatePositionsSchema>;
export type PromoteReservationInput = z.infer<typeof promoteReservationSchema>;
