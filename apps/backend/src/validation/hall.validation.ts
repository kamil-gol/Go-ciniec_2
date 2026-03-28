/**
 * Hall Validation Schemas (Zod)
 */

import { z } from 'zod';

export const createHallSchema = z.object({
  name: z.string().min(1, 'Nazwa sali jest wymagana').max(200),
  capacity: z.number().int().min(1, 'Pojemność musi być >= 1'),
  description: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().default(true),
  allowMultipleBookings: z.boolean().default(false),
  maxSimultaneousBookings: z.number().int().min(1).optional().nullable(),
});

export const updateHallSchema = createHallSchema.partial();
