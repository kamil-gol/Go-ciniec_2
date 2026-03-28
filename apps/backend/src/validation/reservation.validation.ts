/**
 * Reservation Validation Schemas (Zod)
 */

import { z } from 'zod';

export const createReservationSchema = z.object({
  clientId: z.string().uuid('clientId musi być UUID'),
  hallId: z.string().uuid('hallId musi być UUID'),
  eventTypeId: z.string().uuid('eventTypeId musi być UUID'),
  startDateTime: z.string().datetime({ message: 'Nieprawidłowy format ISO 8601' }),
  endDateTime: z.string().datetime({ message: 'Nieprawidłowy format ISO 8601' }),
  adults: z.number().int().min(1, 'Wymagany min. 1 dorosły'),
  children: z.number().int().min(0).default(0),
  toddlers: z.number().int().min(0).default(0),
  pricePerAdult: z.number().min(0, 'Cena za dorosłego >= 0'),
  pricePerChild: z.number().min(0).default(0),
  pricePerToddler: z.number().min(0).default(0),
  status: z.enum(['PENDING', 'CONFIRMED', 'RESERVED']).default('PENDING'),
  notes: z.string().max(5000).optional().nullable(),
  customEventType: z.string().max(255).optional().nullable(),
  birthdayAge: z.number().int().min(0).max(150).optional().nullable(),
  anniversaryYear: z.number().int().min(0).optional().nullable(),
  anniversaryOccasion: z.string().max(255).optional().nullable(),
  venueSurcharge: z.number().min(0).optional().nullable(),
  venueSurchargeLabel: z.string().max(255).optional().nullable(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).optional().nullable(),
  discountValue: z.number().min(0).optional().nullable(),
});

export const updateReservationSchema = createReservationSchema.partial();

export const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'RESERVED', 'COMPLETED', 'CANCELLED']),
  cancellationReason: z.string().max(1000).optional().nullable(),
});

export const selectMenuSchema = z.object({
  menuTemplateId: z.string().uuid('menuTemplateId musi być UUID'),
  packageId: z.string().uuid('packageId musi być UUID'),
  dishSelections: z.array(z.object({
    categoryId: z.string().uuid(),
    categoryName: z.string(),
    portionTarget: z.string().optional(),
    dishes: z.array(z.object({
      dishId: z.string().uuid(),
      dishName: z.string().optional(),
      name: z.string().optional(),
      description: z.string().optional().nullable(),
      quantity: z.number().int().min(1).optional(),
    })),
  })),
  adultsCount: z.number().int().min(0).optional(),
  childrenCount: z.number().int().min(0).optional(),
  toddlersCount: z.number().int().min(0).optional(),
});
