/**
 * Settings Validation Schemas (Zod)
 * Validation for user management, roles, company settings, and archive
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// Users
// ═══════════════════════════════════════════════════════════════

export const createUserSchema = z.object({
  email: z
    .string()
    .email('Nieprawidłowy format adresu email')
    .max(255, 'Email max 255 znaków'),
  password: z
    .string()
    .min(6, 'Hasło musi mieć min. 6 znaków')
    .max(128, 'Hasło max 128 znaków'),
  firstName: z.string().min(1, 'Imię jest wymagane').max(100, 'Imię max 100 znaków'),
  lastName: z.string().min(1, 'Nazwisko jest wymagane').max(100, 'Nazwisko max 100 znaków'),
  roleId: z.string().uuid('roleId musi być UUID'),
});

export const updateUserSchema = z.object({
  email: z.string().email('Nieprawidłowy format adresu email').max(255).optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  roleId: z.string().uuid('roleId musi być UUID').optional(),
});

export const changePasswordSchema = z.object({
  newPassword: z
    .string()
    .min(6, 'Nowe hasło musi mieć min. 6 znaków')
    .max(128, 'Hasło max 128 znaków'),
});

// ═══════════════════════════════════════════════════════════════
// Roles
// ═══════════════════════════════════════════════════════════════

const roleSlugPattern = /^[a-z0-9_-]+$/;

export const createRoleSchema = z.object({
  name: z.string().min(1, 'Nazwa roli jest wymagana').max(100, 'Nazwa max 100 znaków'),
  slug: z
    .string()
    .min(1, 'Slug jest wymagany')
    .max(100, 'Slug max 100 znaków')
    .regex(roleSlugPattern, 'Slug może zawierać tylko małe litery, cyfry, - i _'),
  description: z.string().max(500).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  permissionIds: z
    .array(z.string().uuid('Każdy permissionId musi być UUID'))
    .min(0),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(roleSlugPattern, 'Slug może zawierać tylko małe litery, cyfry, - i _')
    .optional(),
  description: z.string().max(500).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
});

export const updateRolePermissionsSchema = z.object({
  permissionIds: z
    .array(z.string().uuid('Każdy permissionId musi być UUID'))
    .min(0),
});

// ═══════════════════════════════════════════════════════════════
// Company Settings
// ═══════════════════════════════════════════════════════════════

export const updateCompanySettingsSchema = z.object({
  companyName: z.string().min(1).max(255).optional(),
  nip: z.string().max(20).optional().nullable(),
  regon: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(10).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email('Nieprawidłowy email').max(255).optional().nullable(),
  website: z.string().url('Nieprawidłowy URL').max(500).optional().nullable(),
  logoUrl: z.string().url('Nieprawidłowy URL logo').max(500).optional().nullable(),
  defaultCurrency: z.string().min(3).max(3).optional(),
  timezone: z.string().max(100).optional(),
  invoicePrefix: z.string().max(20).optional().nullable(),
  receiptPrefix: z.string().max(20).optional().nullable(),
  archiveAfterDays: z.number().int().min(1).max(365).optional(),
});

// ═══════════════════════════════════════════════════════════════
// Archive Settings
// ═══════════════════════════════════════════════════════════════

export const updateArchiveSettingsSchema = z.object({
  archiveAfterDays: z
    .number({ required_error: 'archiveAfterDays jest wymagane' })
    .int('archiveAfterDays musi być liczbą całkowitą')
    .min(1, 'Minimum 1 dzień')
    .max(365, 'Maksimum 365 dni'),
});

// ═══════════════════════════════════════════════════════════════
// Inferred Types
// ═══════════════════════════════════════════════════════════════

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UpdateRolePermissionsInput = z.infer<typeof updateRolePermissionsSchema>;
export type UpdateCompanySettingsInput = z.infer<typeof updateCompanySettingsSchema>;
export type UpdateArchiveSettingsInput = z.infer<typeof updateArchiveSettingsSchema>;
