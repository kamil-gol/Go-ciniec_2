/**
 * attachmentCategories constants — Unit Tests
 * Tests: ATTACHMENT_CATEGORIES object structure, MAX_FILE_SIZE
 */

import { ATTACHMENT_CATEGORIES, MAX_FILE_SIZE } from '../../../constants/attachmentCategories';

describe('attachmentCategories constants', () => {
  describe('ATTACHMENT_CATEGORIES', () => {
    it('should have required entity types', () => {
      expect(ATTACHMENT_CATEGORIES).toHaveProperty('CLIENT');
      expect(ATTACHMENT_CATEGORIES).toHaveProperty('DEPOSIT');
      expect(ATTACHMENT_CATEGORIES).toHaveProperty('RESERVATION');
    });

    it('should have array values for each entity type', () => {
      expect(Array.isArray(ATTACHMENT_CATEGORIES.CLIENT)).toBe(true);
      expect(Array.isArray(ATTACHMENT_CATEGORIES.DEPOSIT)).toBe(true);
      expect(Array.isArray(ATTACHMENT_CATEGORIES.RESERVATION)).toBe(true);
    });

    it('should have RODO category in CLIENT', () => {
      const rodo = ATTACHMENT_CATEGORIES.CLIENT.find(c => c.value === 'RODO');
      expect(rodo).toBeDefined();
      expect(rodo?.label).toBe('Zgoda RODO');
    });

    it('should have CONTRACT category in RESERVATION', () => {
      const contract = ATTACHMENT_CATEGORIES.RESERVATION.find(c => c.value === 'CONTRACT');
      expect(contract).toBeDefined();
      expect(contract?.label).toBe('Umowa');
    });

    it('should have PAYMENT_PROOF in DEPOSIT', () => {
      const proof = ATTACHMENT_CATEGORIES.DEPOSIT.find(c => c.value === 'PAYMENT_PROOF');
      expect(proof).toBeDefined();
      expect(proof?.label).toBe('Potwierdzenie przelewu');
    });

    it('should have OTHER in all entity types', () => {
      expect(ATTACHMENT_CATEGORIES.CLIENT.some(c => c.value === 'OTHER')).toBe(true);
      expect(ATTACHMENT_CATEGORIES.DEPOSIT.some(c => c.value === 'OTHER')).toBe(true);
      expect(ATTACHMENT_CATEGORIES.RESERVATION.some(c => c.value === 'OTHER')).toBe(true);
    });
  });

  describe('MAX_FILE_SIZE', () => {
    it('should be 25 MB', () => {
      expect(MAX_FILE_SIZE).toBe(25 * 1024 * 1024);
    });

    it('should be a positive number', () => {
      expect(MAX_FILE_SIZE).toBeGreaterThan(0);
    });

    it('should be at least 10 MB', () => {
      expect(MAX_FILE_SIZE).toBeGreaterThanOrEqual(10 * 1024 * 1024);
    });
  });

  describe('category structure', () => {
    it('each category should have value, label, description', () => {
      const allCategories = [
        ...ATTACHMENT_CATEGORIES.CLIENT,
        ...ATTACHMENT_CATEGORIES.DEPOSIT,
        ...ATTACHMENT_CATEGORIES.RESERVATION,
      ];

      allCategories.forEach(cat => {
        expect(cat).toHaveProperty('value');
        expect(cat).toHaveProperty('label');
        expect(cat).toHaveProperty('description');
        expect(typeof cat.value).toBe('string');
        expect(typeof cat.label).toBe('string');
        expect(typeof cat.description).toBe('string');
      });
    });

    it('should not have duplicate values within entity types', () => {
      const checkDuplicates = (arr: any[]) => {
        const values = arr.map(c => c.value);
        return values.length === new Set(values).size;
      };

      expect(checkDuplicates(ATTACHMENT_CATEGORIES.CLIENT)).toBe(true);
      expect(checkDuplicates(ATTACHMENT_CATEGORIES.DEPOSIT)).toBe(true);
      expect(checkDuplicates(ATTACHMENT_CATEGORIES.RESERVATION)).toBe(true);
    });
  });
});
