import { validatePassword, getPasswordRequirements } from './password';

describe('Password Validation', () => {
  describe('validatePassword', () => {
    it('should accept valid password', () => {
      const result = validatePassword('ValidPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password shorter than 12 characters', () => {
      const result = validatePassword('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('at least 12 characters');
    });

    it('should reject password without uppercase letter', () => {
      const result = validatePassword('lowercase123!');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('uppercase'))).toBe(true);
    });

    it('should reject password without lowercase letter', () => {
      const result = validatePassword('UPPERCASE123!');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('lowercase'))).toBe(true);
    });

    it('should reject password without digit', () => {
      const result = validatePassword('NoDigitPassword!');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('digit'))).toBe(true);
    });

    it('should reject password without special character', () => {
      const result = validatePassword('NoSpecialChar123');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('special character'))).toBe(true);
    });

    it('should accept multiple valid passwords', () => {
      const validPasswords = [
        'ValidPass123!',
        'MyPassword@2024',
        'Test123#Secure',
        'Complex$Pass99',
      ];

      validPasswords.forEach((password) => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('getPasswordRequirements', () => {
    it('should return array of requirements', () => {
      const requirements = getPasswordRequirements();
      expect(Array.isArray(requirements)).toBe(true);
      expect(requirements.length).toBeGreaterThan(0);
    });

    it('should include all requirement types', () => {
      const requirements = getPasswordRequirements();
      const requirementString = requirements.join(' ');

      expect(requirementString).toContain('12 characters');
      expect(requirementString).toContain('uppercase');
      expect(requirementString).toContain('lowercase');
      expect(requirementString).toContain('digit');
      expect(requirementString).toContain('special character');
    });
  });
});
