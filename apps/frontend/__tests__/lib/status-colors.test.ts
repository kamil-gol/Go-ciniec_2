import { describe, it, expect } from 'vitest';
import {
  reservationStatusColors,
  depositStatusColors,
  queueStatusColors,
  cateringStatusColors,
  extrasStatusColors,
  semanticColors,
  getStatusConfig,
  getStatusBadgeClass,
} from '../../lib/status-colors';

describe('status-colors', () => {
  describe('color config objects', () => {
    it('should have reservation status configs', () => {
      expect(Object.keys(reservationStatusColors).length).toBeGreaterThan(0);
    });

    it('should have deposit status configs', () => {
      expect(Object.keys(depositStatusColors).length).toBeGreaterThan(0);
    });

    it('should have queue status configs', () => {
      expect(Object.keys(queueStatusColors).length).toBeGreaterThan(0);
    });

    it('should have catering status configs', () => {
      expect(Object.keys(cateringStatusColors).length).toBeGreaterThan(0);
    });

    it('should have extras status configs', () => {
      expect(Object.keys(extrasStatusColors).length).toBeGreaterThan(0);
    });

    it('should have semantic colors', () => {
      expect(semanticColors).toBeDefined();
      expect(semanticColors.success).toBeDefined();
      expect(semanticColors.error).toBeDefined();
    });

    it('each config should have required properties', () => {
      const allConfigs = [
        ...Object.values(reservationStatusColors),
        ...Object.values(depositStatusColors),
      ];

      allConfigs.forEach((config) => {
        expect(config).toHaveProperty('label');
        expect(config).toHaveProperty('bg');
        expect(config).toHaveProperty('text');
      });
    });
  });

  describe('getStatusConfig', () => {
    it('should return config for reservation status', () => {
      const firstStatus = Object.keys(reservationStatusColors)[0];
      const config = getStatusConfig('reservation', firstStatus);
      expect(config).toBeDefined();
      expect(config).toHaveProperty('label');
    });

    it('should return config for deposit status', () => {
      const firstStatus = Object.keys(depositStatusColors)[0];
      const config = getStatusConfig('deposit', firstStatus);
      expect(config).toBeDefined();
    });

    it('should return config for queue status', () => {
      const firstStatus = Object.keys(queueStatusColors)[0];
      const config = getStatusConfig('queue', firstStatus);
      expect(config).toBeDefined();
    });
  });

  describe('getStatusBadgeClass', () => {
    it('should return a string class', () => {
      const config = Object.values(reservationStatusColors)[0];
      const badgeClass = getStatusBadgeClass(config);
      expect(typeof badgeClass).toBe('string');
      expect(badgeClass.length).toBeGreaterThan(0);
    });
  });
});
