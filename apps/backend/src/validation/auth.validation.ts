/**
 * Auth Validation Schemas (Zod)
 */

import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Nieprawidłowy format email'),
  password: z.string().min(1, 'Hasło jest wymagane'),
});

export const registerSchema = z.object({
  email: z.string().email('Nieprawidłowy format email'),
  password: z.string().min(8, 'Hasło musi mieć min. 8 znaków'),
  firstName: z.string().min(1, 'Imię jest wymagane').max(100),
  lastName: z.string().min(1, 'Nazwisko jest wymagane').max(100),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken jest wymagany'),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken jest wymagany'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Nieprawidłowy format email'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token jest wymagany'),
  newPassword: z.string().min(8, 'Hasło musi mieć min. 8 znaków'),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Aktualne hasło jest wymagane'),
  newPassword: z.string().min(8, 'Nowe hasło musi mieć min. 8 znaków'),
});
