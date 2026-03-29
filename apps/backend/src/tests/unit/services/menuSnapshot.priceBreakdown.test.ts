import { describe, it, expect } from 'vitest';
import { MenuSnapshotService } from '../../../services/menuSnapshot.service';
import { MenuSnapshotData, MenuPriceBreakdown } from '../../../types/menu.types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeMenuData(overrides: Partial<MenuSnapshotData> = {}): MenuSnapshotData {
  return {
    templateId: 'tpl-1',
    templateName: 'Szablon testowy',
    templateVariant: null,
    eventTypeName: 'Wesele',
    packageId: 'pkg-1',
    packageName: 'Pakiet Gold',
    packageDescription: null,
    pricePerAdult: 150,
    pricePerChild: 80,
    pricePerToddler: 0,
    includedItems: [],
    packageColor: null,
    packageIcon: null,
    selectedOptions: [],
    ...overrides,
  };
}

function flatOption(name: string, priceAmount: number, quantity: number) {
  return {
    optionId: `opt-flat-${name}`,
    name,
    description: null,
    category: 'OTHER',
    priceType: 'FLAT' as const,
    priceAmount,
    quantity,
    icon: null,
  };
}

function perPersonOption(name: string, priceAmount: number, quantity: number) {
  return {
    optionId: `opt-pp-${name}`,
    name,
    description: null,
    category: 'OTHER',
    priceType: 'PER_PERSON' as const,
    priceAmount,
    quantity,
    icon: null,
  };
}

function freeOption(name: string, quantity: number) {
  return {
    optionId: `opt-free-${name}`,
    name,
    description: null,
    category: 'OTHER',
    priceType: 'FREE' as const,
    priceAmount: 0,
    quantity,
    icon: null,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('MenuSnapshotService.calculatePriceBreakdown', () => {
  const service = new MenuSnapshotService();

  // ── packageCost.subtotal ───────────────────────────────────────────────

  it('packageCost.subtotal = adults*pricePerAdult + children*pricePerChild + toddlers*pricePerToddler', () => {
    const menuData = makeMenuData({
      pricePerAdult: 150,
      pricePerChild: 80,
      pricePerToddler: 20,
    });

    const result = service.calculatePriceBreakdown(menuData, 10, 5, 3);

    expect(result.packageCost.adults).toEqual({ count: 10, priceEach: 150, total: 1500 });
    expect(result.packageCost.children).toEqual({ count: 5, priceEach: 80, total: 400 });
    expect(result.packageCost.toddlers).toEqual({ count: 3, priceEach: 20, total: 60 });
    expect(result.packageCost.subtotal).toBe(1500 + 400 + 60);
  });

  // ── FLAT options ───────────────────────────────────────────────────────

  it('optionsSubtotal for FLAT options = priceAmount * quantity', () => {
    const menuData = makeMenuData({
      selectedOptions: [flatOption('Dekoracje', 500, 2)],
    });

    const result = service.calculatePriceBreakdown(menuData, 10, 0, 0);

    expect(result.optionsCost).toHaveLength(1);
    expect(result.optionsCost[0]).toEqual({
      option: 'Dekoracje',
      priceType: 'FLAT',
      priceEach: 500,
      quantity: 2,
      total: 1000,
    });
    expect(result.optionsSubtotal).toBe(1000);
  });

  // ── PER_PERSON options ─────────────────────────────────────────────────

  it('optionsSubtotal for PER_PERSON options = priceAmount * totalGuests * quantity', () => {
    const menuData = makeMenuData({
      selectedOptions: [perPersonOption('Drink bar', 30, 1)],
    });

    // totalGuests = 10 + 5 + 2 = 17
    const result = service.calculatePriceBreakdown(menuData, 10, 5, 2);

    expect(result.optionsCost[0]).toEqual({
      option: 'Drink bar',
      priceType: 'PER_PERSON',
      priceEach: 30,
      quantity: 17, // overwritten to totalGuests
      total: 30 * 17 * 1,
    });
    expect(result.optionsSubtotal).toBe(510);
  });

  // ── FREE options ───────────────────────────────────────────────────────

  it('optionsSubtotal for FREE options = 0', () => {
    const menuData = makeMenuData({
      selectedOptions: [freeOption('Parking', 1)],
    });

    const result = service.calculatePriceBreakdown(menuData, 20, 10, 5);

    expect(result.optionsCost[0]).toEqual({
      option: 'Parking',
      priceType: 'FREE',
      priceEach: 0,
      quantity: 1,
      total: 0,
    });
    expect(result.optionsSubtotal).toBe(0);
  });

  // ── totalMenuPrice ─────────────────────────────────────────────────────

  it('totalMenuPrice = packageCost.subtotal + optionsSubtotal', () => {
    const menuData = makeMenuData({
      pricePerAdult: 100,
      pricePerChild: 50,
      pricePerToddler: 0,
      selectedOptions: [flatOption('Foto', 1000, 1)],
    });

    const result = service.calculatePriceBreakdown(menuData, 10, 5, 0);

    const expectedPackage = 10 * 100 + 5 * 50; // 1250
    const expectedOptions = 1000;
    expect(result.packageCost.subtotal).toBe(expectedPackage);
    expect(result.optionsSubtotal).toBe(expectedOptions);
    expect(result.totalMenuPrice).toBe(expectedPackage + expectedOptions);
  });

  // ── Mixed options ──────────────────────────────────────────────────────

  it('mixed options (FLAT + PER_PERSON + FREE) are summed correctly', () => {
    const menuData = makeMenuData({
      pricePerAdult: 200,
      pricePerChild: 100,
      pricePerToddler: 0,
      selectedOptions: [
        flatOption('DJ', 2000, 1),
        perPersonOption('Napoje', 25, 1),
        freeOption('Szatnia', 1),
      ],
    });

    // totalGuests = 20 + 10 + 5 = 35
    const result = service.calculatePriceBreakdown(menuData, 20, 10, 5);

    const expectedPackage = 20 * 200 + 10 * 100 + 5 * 0; // 5000
    const flatTotal = 2000 * 1; // 2000
    const ppTotal = 25 * 35 * 1; // 875
    const freeTotal = 0;

    expect(result.packageCost.subtotal).toBe(expectedPackage);
    expect(result.optionsSubtotal).toBe(flatTotal + ppTotal + freeTotal);
    expect(result.totalMenuPrice).toBe(expectedPackage + flatTotal + ppTotal + freeTotal);
    expect(result.optionsCost).toHaveLength(3);
  });

  // ── Zero guests edge case ──────────────────────────────────────────────

  it('zero guests edge case returns all zeros', () => {
    const menuData = makeMenuData({
      pricePerAdult: 150,
      pricePerChild: 80,
      pricePerToddler: 20,
      selectedOptions: [
        perPersonOption('Napoje', 25, 1),
        flatOption('DJ', 2000, 1),
      ],
    });

    const result = service.calculatePriceBreakdown(menuData, 0, 0, 0);

    expect(result.packageCost.subtotal).toBe(0);
    // PER_PERSON with 0 guests = 0
    expect(result.optionsCost[0].total).toBe(0);
    // FLAT still charged
    expect(result.optionsCost[1].total).toBe(2000);
    expect(result.optionsSubtotal).toBe(2000);
    expect(result.totalMenuPrice).toBe(2000);
  });

  // ── Recalculation after guest count change ─────────────────────────────

  it('totalMenuPrice recalculated correctly after guest count change', () => {
    const menuData = makeMenuData({
      pricePerAdult: 100,
      pricePerChild: 50,
      pricePerToddler: 10,
      selectedOptions: [
        perPersonOption('Open bar', 40, 1),
        flatOption('Dekoracje', 3000, 1),
      ],
    });

    // Initial: 10 adults, 5 children, 2 toddlers = 17 guests
    const initial = service.calculatePriceBreakdown(menuData, 10, 5, 2);
    const initialPackage = 10 * 100 + 5 * 50 + 2 * 10; // 1270
    const initialPP = 40 * 17 * 1; // 680
    expect(initial.packageCost.subtotal).toBe(initialPackage);
    expect(initial.totalMenuPrice).toBe(initialPackage + initialPP + 3000);

    // Updated: 20 adults, 10 children, 5 toddlers = 35 guests
    const updated = service.calculatePriceBreakdown(menuData, 20, 10, 5);
    const updatedPackage = 20 * 100 + 10 * 50 + 5 * 10; // 2550
    const updatedPP = 40 * 35 * 1; // 1400
    expect(updated.packageCost.subtotal).toBe(updatedPackage);
    expect(updated.totalMenuPrice).toBe(updatedPackage + updatedPP + 3000);

    // Verify the totals actually changed
    expect(updated.totalMenuPrice).toBeGreaterThan(initial.totalMenuPrice);
  });
});
