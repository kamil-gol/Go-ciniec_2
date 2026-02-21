import { PasswordValidationResult } from '@types/index';
import { pl } from '../i18n/pl';

/**
 * Waliduje hasło zgodnie z wymogami bezpieczeństwa Gościniec Rodzinny:
 * - Minimum 12 znaków
 * - Co najmniej 1 wielka litera
 * - Co najmniej 1 mała litera
 * - Co najmniej 1 cyfra
 * - Co najmniej 1 znak specjalny (!@#$%^&*)
 *
 * @param password - Hasło do walidacji
 * @returns Wynik walidacji z listą błędów
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || password.length < 12) {
    errors.push(pl.password.tooShort);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push(pl.password.needsUppercase);
  }

  if (!/[a-z]/.test(password)) {
    errors.push(pl.password.needsLowercase);
  }

  if (!/\d/.test(password)) {
    errors.push(pl.password.needsDigit);
  }

  if (!/[!@#$%^&*]/.test(password)) {
    errors.push(pl.password.needsSpecial);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Zwraca czytelne wymagania dotyczące hasła (dla odpowiedzi API)
 */
export function getPasswordRequirements(): string[] {
  return [...pl.password.requirements];
}
