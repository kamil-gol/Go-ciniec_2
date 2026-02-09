import { PasswordValidationResult } from '@types/index';
/**
 * Validates password against Gościniec Rodzinny security requirements:
 * - Minimum 12 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 digit
 * - At least 1 special character (!@#$%^&*)
 *
 * @param password - Password to validate
 * @returns Validation result with errors if any
 */
export declare function validatePassword(password: string): PasswordValidationResult;
/**
 * Gets human-readable password requirements for API responses
 */
export declare function getPasswordRequirements(): string[];
//# sourceMappingURL=password.d.ts.map