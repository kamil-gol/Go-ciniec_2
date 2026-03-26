/**
 * Unit tests for deposits/deposit.helpers.ts
 * Covers: DEPOSIT_INCLUDE, getFullReservationPrice
 */

import { DEPOSIT_INCLUDE, getFullReservationPrice } from '../../../../services/deposits/deposit.helpers';

describe('DEPOSIT_INCLUDE', () => {
  it('includes reservation with client, hall, eventType', () => {
    expect(DEPOSIT_INCLUDE.reservation.include).toEqual({
      client: true,
      hall: true,
      eventType: true,
    });
  });
});

describe('getFullReservationPrice', () => {
  it('sums totalPrice and extrasTotalPrice', () => {
    expect(getFullReservationPrice({ totalPrice: 5000, extrasTotalPrice: 1200 })).toBe(6200);
  });

  it('handles string values', () => {
    expect(getFullReservationPrice({ totalPrice: '3000', extrasTotalPrice: '500' })).toBe(3500);
  });

  it('defaults to 0 for missing values', () => {
    expect(getFullReservationPrice({})).toBe(0);
  });

  it('handles null/undefined values', () => {
    expect(getFullReservationPrice({ totalPrice: null, extrasTotalPrice: undefined })).toBe(0);
  });

  it('handles only totalPrice', () => {
    expect(getFullReservationPrice({ totalPrice: 2000 })).toBe(2000);
  });

  it('handles only extrasTotalPrice', () => {
    expect(getFullReservationPrice({ extrasTotalPrice: 800 })).toBe(800);
  });
});
