/**
 * Client Validation Schemas (Zod)
 */

import { z } from 'zod';

export const createClientSchema = z.object({
  firstName: z.string().min(1, 'Imię jest wymagane').max(100),
  lastName: z.string().min(1, 'Nazwisko jest wymagane').max(100),
  email: z.string().email('Nieprawidłowy email').optional().nullable(),
  phone: z.string().min(1, 'Telefon jest wymagany').max(20),
  clientType: z.enum(['INDIVIDUAL', 'COMPANY']).default('INDIVIDUAL'),
  companyName: z.string().max(200).optional().nullable(),
  nip: z.string().max(20).optional().nullable(),
  regon: z.string().max(20).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  website: z.string().max(200).optional().nullable(),
  companyAddress: z.string().max(500).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
});

export const updateClientSchema = createClientSchema.partial();

export const addContactSchema = z.object({
  firstName: z.string().min(1, 'Imię jest wymagane').max(100),
  lastName: z.string().min(1, 'Nazwisko jest wymagane').max(100),
  email: z.string().email('Nieprawidłowy email').optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  role: z.string().max(100).optional().nullable(),
  isPrimary: z.boolean().optional(),
});

export const updateContactSchema = addContactSchema.partial();
