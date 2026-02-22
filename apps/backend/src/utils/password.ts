/**
 * Password validation utilities
 * 🇵🇱 Spolonizowany — komunikaty z i18n/pl.ts
 */
import { PASSWORD } from '../i18n/pl';

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  requirements: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || password.length < 12) {
    errors.push(PASSWORD.TOO_SHORT);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push(PASSWORD.NEEDS_UPPERCASE);
  }

  if (!/[a-z]/.test(password)) {
    errors.push(PASSWORD.NEEDS_LOWERCASE);
  }

  if (!/[0-9]/.test(password)) {
    errors.push(PASSWORD.NEEDS_DIGIT);
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push(PASSWORD.NEEDS_SPECIAL);
  }

  return {
    valid: errors.length === 0,
    errors,
    requirements: [...PASSWORD.REQUIREMENTS],
  };
}
