import { PasswordValidationResult } from '@types/index';
import pl from '../i18n/pl';

/**
 * Validates password against Gościniec security requirements:
 * - Minimum 12 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 digit
 * - At least 1 special character (!@#$%^&*)
 *
 * @param password - Password to validate
 * @returns Validation result with errors if any
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
 * Gets human-readable password requirements for API responses
 */
export function getPasswordRequirements(): string[] {
  return [...pl.password.requirements];
}
