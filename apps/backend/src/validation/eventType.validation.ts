/**
 * EventType Validation Schemas (Zod)
 */

import { z } from 'zod';

export const createEventTypeSchema = z.object({
  name: z.string().min(1, 'Nazwa typu jest wymagana').max(200),
  color: z.string().max(30).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  defaultDurationHours: z.number().min(0.5).max(24).optional().nullable(),
  extraHourRate: z.number().min(0).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateEventTypeSchema = createEventTypeSchema.partial();
