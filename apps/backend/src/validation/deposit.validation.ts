/**
 * Deposit Validation Schemas (Zod)
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// Enums
// ═══════════════════════════════════════════════════════════════

export const DepositStatusEnum = z.enum([
  'PENDING',
  'PAID',
  'OVERDUE',
  'CANCELLED',
  'PARTIALLY_PAID',
]);

export const PaymentMethodEnum = z.enum([
  'CASH',
  'TRANSFER',
  'BLIK',
  'CARD',
]);

// ═══════════════════════════════════════════════════════════════
// Create Deposit
// ═══════════════════════════════════════════════════════════════

export const createDepositSchema = z.object({
  amount: z
    .number({ required_error: 'Kwota jest wymagana' })
    .positive('Kwota musi być większa od 0')
    .max(999999.99, 'Kwota nie może przekraczać 999 999,99 PLN'),
  dueDate: z
    .string({ required_error: 'Termin płatności jest wymagany' })
    .refine(
      (val) => !isNaN(Date.parse(val)),
      'Nieprawidłowy format daty'
    ),
  notes: z.string().max(1000, 'Notatki mogą mieć max 1000 znaków').optional(),
});

// ═══════════════════════════════════════════════════════════════
// Update Deposit
// ═══════════════════════════════════════════════════════════════

export const updateDepositSchema = z.object({
  amount: z
    .number()
    .positive('Kwota musi być większa od 0')
    .max(999999.99, 'Kwota nie może przekraczać 999 999,99 PLN')
    .optional(),
  dueDate: z
    .string()
    .refine(
      (val) => !isNaN(Date.parse(val)),
      'Nieprawidłowy format daty'
    )
    .optional(),
  notes: z.string().max(1000, 'Notatki mogą mieć max 1000 znaków').optional(),
}).refine(
  (data) => data.amount !== undefined || data.dueDate !== undefined || data.notes !== undefined,
  { message: 'Podaj przynajmniej jedno pole do aktualizacji' }
);

// ═══════════════════════════════════════════════════════════════
// Mark as Paid
// ═══════════════════════════════════════════════════════════════

export const markPaidSchema = z.object({
  paymentMethod: PaymentMethodEnum,
  paidAt: z
    .string({ required_error: 'Data płatności jest wymagana' })
    .refine(
      (val) => !isNaN(Date.parse(val)),
      'Nieprawidłowy format daty'
    ),
  amountPaid: z
    .number()
    .positive('Kwota musi być większa od 0')
    .optional(),
  notes: z.string().max(1000).optional(),
});

// ═══════════════════════════════════════════════════════════════
// List Filters (query params)
// ═══════════════════════════════════════════════════════════════

export const depositFiltersSchema = z.object({
  reservationId: z.string().uuid().optional(),
  status: DepositStatusEnum.optional(),
  overdue: z.coerce.boolean().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  paid: z.coerce.boolean().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['dueDate', 'amount', 'createdAt', 'status']).default('dueDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});
