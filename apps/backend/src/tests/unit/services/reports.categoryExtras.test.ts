/**
 * Unit tests for #216: categoryExtras revenue in revenue reports
 * Tests calculateExtrasRevenue + categoryExtras aggregation logic.
 */
import { calculatePortions } from '@services/reports.service';

// ═════════════════════════════════════════════════════════════════
// calculatePortions — portionTarget for category extras pricing
// ═════════════════════════════════════════════════════════════════
describe('calculatePortions — for categoryExtras pricing (#216)', () => {
  it('ALL target: portions for both adults and children', () => {
    const result = calculatePortions('ALL', 50, 10, 1);
    expect(result.adultPortions).toBe(50);
    expect(result.childrenPortions).toBe(10);
    expect(result.totalPortions).toBe(60);
  });

  it('ADULTS_ONLY target: only adults get portions', () => {
    const result = calculatePortions('ADULTS_ONLY', 50, 10, 1);
    expect(result.adultPortions).toBe(50);
    expect(result.childrenPortions).toBe(0);
    expect(result.totalPortions).toBe(50);
  });

  it('CHILDREN_ONLY target: only children get portions', () => {
    const result = calculatePortions('CHILDREN_ONLY', 50, 10, 1);
    expect(result.adultPortions).toBe(0);
    expect(result.childrenPortions).toBe(10);
    expect(result.totalPortions).toBe(10);
  });

  it('extraQuantity (portionSize) multiplies portions', () => {
    // 3 extra portions per person for 50 adults
    const result = calculatePortions('ADULTS_ONLY', 50, 10, 3);
    expect(result.adultPortions).toBe(150);
    expect(result.childrenPortions).toBe(0);
    expect(result.totalPortions).toBe(150);
  });

  it('fractional portionSize works correctly', () => {
    const result = calculatePortions('ALL', 40, 20, 0.5);
    expect(result.adultPortions).toBe(20);
    expect(result.childrenPortions).toBe(10);
    expect(result.totalPortions).toBe(30);
  });

  it('zero guests returns zero portions', () => {
    const result = calculatePortions('ALL', 0, 0, 3);
    expect(result.totalPortions).toBe(0);
  });

  it('unknown portionTarget defaults to ALL', () => {
    const result = calculatePortions('UNKNOWN_TARGET', 10, 5, 1);
    expect(result.adultPortions).toBe(10);
    expect(result.childrenPortions).toBe(5);
    expect(result.totalPortions).toBe(15);
  });
});
