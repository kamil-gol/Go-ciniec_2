/**
 * report-helpers.ts — Pure Unit Tests
 * Covers: formatDateLabelPL, extractTimeFromDateTime, calculateExtrasRevenue,
 *         getClientName, getReservationDate, calculatePortions
 * Brak mocków — czyste funkcje utility
 */

import {
  formatDateLabelPL,
  extractTimeFromDateTime,
  calculateExtrasRevenue,
  getClientName,
  getReservationDate,
  calculatePortions,
  DAY_NAMES_PL,
  MONTH_NAMES_PL,
} from '../../../services/reports/report-helpers';

describe('report-helpers', () => {
  // ========== formatDateLabelPL ==========
  describe('formatDateLabelPL()', () => {
    it('powinno sformatować datę po polsku z nazwą dnia', () => {
      // 2026-03-25 to Wednesday
      const result = formatDateLabelPL('2026-03-25');
      expect(result).toBe('Środa, 25 marca 2026');
    });

    it('powinno obsłużyć niedzielę', () => {
      // 2026-03-29 to Sunday
      const result = formatDateLabelPL('2026-03-29');
      expect(result).toBe('Niedziela, 29 marca 2026');
    });

    it('powinno obsłużyć styczeń (indeks 0)', () => {
      // 2026-01-05 to Monday
      const result = formatDateLabelPL('2026-01-05');
      expect(result).toBe('Poniedziałek, 5 stycznia 2026');
    });

    it('powinno obsłużyć grudzień (indeks 11)', () => {
      // 2026-12-31 to Thursday
      const result = formatDateLabelPL('2026-12-31');
      expect(result).toBe('Czwartek, 31 grudnia 2026');
    });
  });

  // ========== extractTimeFromDateTime ==========
  describe('extractTimeFromDateTime()', () => {
    it('powinno wyciągnąć godzinę z obiektu Date', () => {
      const d = new Date('2026-03-25T14:30:00');
      expect(extractTimeFromDateTime(d)).toBe('14:30');
    });

    it('powinno wyciągnąć godzinę ze stringa ISO', () => {
      expect(extractTimeFromDateTime('2026-03-25T09:05:00')).toBe('09:05');
    });

    it('powinno zwrócić null dla null', () => {
      expect(extractTimeFromDateTime(null)).toBeNull();
    });

    it('powinno zwrócić null dla undefined', () => {
      expect(extractTimeFromDateTime(undefined)).toBeNull();
    });

    it('powinno zwrócić null dla nieprawidłowej daty', () => {
      expect(extractTimeFromDateTime('not-a-date')).toBeNull();
    });

    it('powinno padować godziny i minuty zerami', () => {
      const d = new Date('2026-01-01T03:07:00');
      expect(extractTimeFromDateTime(d)).toBe('03:07');
    });
  });

  // ========== calculateExtrasRevenue ==========
  describe('calculateExtrasRevenue()', () => {
    const mkExtra = (overrides: Partial<{
      quantity: number;
      unitPrice: number | null;
      totalPrice: number | null;
      serviceItem: { basePrice: number; priceType: string; name: string; id: string };
    }> = {}) => ({
      quantity: 1,
      unitPrice: null,
      totalPrice: null,
      serviceItem: { id: 'si-1', name: 'DJ', basePrice: 500, priceType: 'FLAT' },
      ...overrides,
    });

    it('powinno użyć totalPrice gdy dostępne', () => {
      const extras = [mkExtra({ totalPrice: 1200 })];
      const result = calculateExtrasRevenue(extras, 100);
      expect(result.total).toBe(1200);
      expect(result.items[0].revenue).toBe(1200);
    });

    it('powinno obliczyć FLAT: unitPrice * quantity', () => {
      const extras = [mkExtra({ quantity: 3, unitPrice: 200 })];
      const result = calculateExtrasRevenue(extras, 100);
      expect(result.total).toBe(600);
    });

    it('powinno obliczyć FLAT z basePrice gdy brak unitPrice', () => {
      const extras = [mkExtra({ quantity: 2 })];
      const result = calculateExtrasRevenue(extras, 100);
      expect(result.total).toBe(1000); // 500 * 2
    });

    it('powinno obliczyć PER_PERSON: price * qty * guests', () => {
      const extras = [mkExtra({
        quantity: 1,
        unitPrice: 50,
        serviceItem: { id: 'si-2', name: 'Drink', basePrice: 50, priceType: 'PER_PERSON' },
      })];
      const result = calculateExtrasRevenue(extras, 80);
      expect(result.total).toBe(4000); // 50 * 1 * 80
    });

    it('powinno zwrócić 0 dla FREE', () => {
      const extras = [mkExtra({
        serviceItem: { id: 'si-3', name: 'Parking', basePrice: 0, priceType: 'FREE' },
      })];
      const result = calculateExtrasRevenue(extras, 100);
      expect(result.total).toBe(0);
    });

    it('powinno obsłużyć wiele extras i zaokrąglać', () => {
      const extras = [
        mkExtra({ totalPrice: 100.555 }),
        mkExtra({ totalPrice: 200.333 }),
      ];
      const result = calculateExtrasRevenue(extras, 10);
      expect(result.total).toBe(300.89); // 100.56 + 200.33
      expect(result.items).toHaveLength(2);
    });

    it('powinno użyć quantity=1 jako fallback gdy 0', () => {
      const extras = [mkExtra({ quantity: 0, unitPrice: 100 })];
      // quantity 0 is falsy, so falls back to 1? No — code uses `extra.quantity || 1`
      // 0 is falsy => qty = 1
      const result = calculateExtrasRevenue(extras, 1);
      expect(result.total).toBe(100); // 100 * 1
    });

    it('powinno zwrócić prawidłowe items z serviceItemId i name', () => {
      const extras = [mkExtra({ totalPrice: 500 })];
      const result = calculateExtrasRevenue(extras, 10);
      expect(result.items[0]).toEqual({
        serviceItemId: 'si-1',
        name: 'DJ',
        revenue: 500,
      });
    });
  });

  // ========== getClientName ==========
  describe('getClientName()', () => {
    it('powinno zwrócić companyName dla klienta firmowego', () => {
      expect(getClientName({
        clientType: 'COMPANY',
        companyName: 'ABC Sp. z o.o.',
        firstName: 'Jan',
        lastName: 'Kowalski',
      })).toBe('ABC Sp. z o.o.');
    });

    it('powinno zwrócić imię i nazwisko dla osoby fizycznej', () => {
      expect(getClientName({
        clientType: 'INDIVIDUAL',
        companyName: null,
        firstName: 'Anna',
        lastName: 'Nowak',
      })).toBe('Anna Nowak');
    });

    it('powinno zwrócić imię i nazwisko gdy COMPANY bez companyName', () => {
      expect(getClientName({
        clientType: 'COMPANY',
        companyName: null,
        firstName: 'Jan',
        lastName: 'Kowalski',
      })).toBe('Jan Kowalski');
    });
  });

  // ========== getReservationDate ==========
  describe('getReservationDate()', () => {
    it('powinno preferować pole date', () => {
      expect(getReservationDate({
        date: '2026-03-25',
        startDateTime: new Date('2026-03-26T10:00:00'),
      })).toBe('2026-03-25');
    });

    it('powinno wyciągnąć datę z startDateTime gdy brak date', () => {
      expect(getReservationDate({
        date: null,
        startDateTime: new Date('2026-03-26T10:00:00'),
      })).toBe('2026-03-26');
    });

    it('powinno obsłużyć startDateTime jako string', () => {
      expect(getReservationDate({
        date: null,
        startDateTime: '2026-03-26T10:00:00',
      })).toBe('2026-03-26');
    });

    it('powinno zwrócić pusty string gdy oba pola null', () => {
      expect(getReservationDate({
        date: null,
        startDateTime: null,
      })).toBe('');
    });
  });

  // ========== calculatePortions ==========
  describe('calculatePortions()', () => {
    it('ADULTS_ONLY: powinno liczyć porcje tylko dla dorosłych', () => {
      const result = calculatePortions('ADULTS_ONLY', 10, 5, 2);
      expect(result.adultPortions).toBe(20);
      expect(result.childrenPortions).toBe(0);
      expect(result.totalPortions).toBe(20);
    });

    it('CHILDREN_ONLY: powinno liczyć porcje tylko dla dzieci', () => {
      const result = calculatePortions('CHILDREN_ONLY', 10, 5, 2);
      expect(result.adultPortions).toBe(0);
      expect(result.childrenPortions).toBe(10);
      expect(result.totalPortions).toBe(10);
    });

    it('ALL: powinno liczyć porcje dla wszystkich', () => {
      const result = calculatePortions('ALL', 10, 5, 3);
      expect(result.adultPortions).toBe(30);
      expect(result.childrenPortions).toBe(15);
      expect(result.totalPortions).toBe(45);
    });

    it('default (nieznana wartość): powinno działać jak ALL', () => {
      const result = calculatePortions('UNKNOWN', 8, 4, 1);
      expect(result.adultPortions).toBe(8);
      expect(result.childrenPortions).toBe(4);
      expect(result.totalPortions).toBe(12);
    });

    it('powinno obsłużyć portionSize = 0', () => {
      const result = calculatePortions('ALL', 10, 5, 0);
      expect(result.totalPortions).toBe(0);
    });
  });

  // ========== Constants ==========
  describe('constants', () => {
    it('DAY_NAMES_PL powinno mieć 7 elementów, zaczynając od Niedzieli', () => {
      expect(DAY_NAMES_PL).toHaveLength(7);
      expect(DAY_NAMES_PL[0]).toBe('Niedziela');
      expect(DAY_NAMES_PL[6]).toBe('Sobota');
    });

    it('MONTH_NAMES_PL powinno mieć 12 elementów', () => {
      expect(MONTH_NAMES_PL).toHaveLength(12);
      expect(MONTH_NAMES_PL[0]).toBe('stycznia');
      expect(MONTH_NAMES_PL[11]).toBe('grudnia');
    });
  });
});
