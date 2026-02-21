import { describe, it, expect } from 'vitest'

// ═══════════════════════════════════════
// Pure logic tests for service extras
// pricing calculations and onFormSubmit
// mapping — extracted from component.
// ═══════════════════════════════════════

interface ServiceItem {
  id: string
  name: string
  basePrice: number
  priceType: 'FLAT' | 'PER_PERSON' | 'FREE'
  category: string
  isActive: boolean
}

interface SelectedExtra {
  serviceItem: ServiceItem
  quantity: number
}

// Mirrors the extrasTotal useMemo from create-reservation-form.tsx
function calculateExtrasTotal(
  selectedExtras: SelectedExtra[],
  totalGuests: number
): number {
  let total = 0
  for (const extra of selectedExtras) {
    const item = extra.serviceItem
    if (item.priceType === 'FREE') continue
    if (item.priceType === 'PER_PERSON') {
      total += item.basePrice * totalGuests * extra.quantity
    } else {
      total += item.basePrice * extra.quantity
    }
  }
  return total
}

// Mirrors the onFormSubmit mapping from create-reservation-form.tsx
function mapExtrasToPayload(
  selectedExtras: SelectedExtra[],
  totalGuests: number
): Array<{
  serviceItemId: string
  quantity: number
  unitPrice: number
  totalPrice: number
}> {
  return selectedExtras.map((extra) => {
    const item = extra.serviceItem
    let unitPrice = item.basePrice
    let totalPrice = 0

    if (item.priceType === 'FREE') {
      unitPrice = 0
      totalPrice = 0
    } else if (item.priceType === 'PER_PERSON') {
      totalPrice = item.basePrice * totalGuests * extra.quantity
    } else {
      // FLAT
      totalPrice = item.basePrice * extra.quantity
    }

    return {
      serviceItemId: item.id,
      quantity: extra.quantity,
      unitPrice,
      totalPrice,
    }
  })
}

// ═══ TEST DATA ═══

const flatItem: ServiceItem = {
  id: 'si-flat',
  name: 'Dekoracja sali',
  basePrice: 1500,
  priceType: 'FLAT',
  category: 'DECORATION',
  isActive: true,
}

const perPersonItem: ServiceItem = {
  id: 'si-pp',
  name: 'Bar koktajlowy',
  basePrice: 80,
  priceType: 'PER_PERSON',
  category: 'BEVERAGE',
  isActive: true,
}

const freeItem: ServiceItem = {
  id: 'si-free',
  name: 'Parking',
  basePrice: 0,
  priceType: 'FREE',
  category: 'LOGISTICS',
  isActive: true,
}

// ═══ TESTS ═══

describe('Service Extras Calculations', () => {
  describe('calculateExtrasTotal', () => {
    it('should return 0 for empty extras list', () => {
      expect(calculateExtrasTotal([], 100)).toBe(0)
    })

    it('should calculate FLAT pricing correctly (basePrice × quantity)', () => {
      const extras: SelectedExtra[] = [
        { serviceItem: flatItem, quantity: 1 },
      ]
      expect(calculateExtrasTotal(extras, 100)).toBe(1500)
    })

    it('should calculate FLAT pricing with quantity > 1', () => {
      const extras: SelectedExtra[] = [
        { serviceItem: flatItem, quantity: 3 },
      ]
      expect(calculateExtrasTotal(extras, 100)).toBe(4500)
    })

    it('should calculate PER_PERSON pricing correctly (basePrice × guests × quantity)', () => {
      const extras: SelectedExtra[] = [
        { serviceItem: perPersonItem, quantity: 1 },
      ]
      expect(calculateExtrasTotal(extras, 100)).toBe(8000) // 80 × 100 × 1
    })

    it('should calculate PER_PERSON with different guest counts', () => {
      const extras: SelectedExtra[] = [
        { serviceItem: perPersonItem, quantity: 1 },
      ]
      expect(calculateExtrasTotal(extras, 50)).toBe(4000) // 80 × 50 × 1
      expect(calculateExtrasTotal(extras, 200)).toBe(16000) // 80 × 200 × 1
    })

    it('should calculate PER_PERSON with quantity > 1', () => {
      const extras: SelectedExtra[] = [
        { serviceItem: perPersonItem, quantity: 2 },
      ]
      expect(calculateExtrasTotal(extras, 100)).toBe(16000) // 80 × 100 × 2
    })

    it('should return 0 for FREE items', () => {
      const extras: SelectedExtra[] = [
        { serviceItem: freeItem, quantity: 1 },
      ]
      expect(calculateExtrasTotal(extras, 100)).toBe(0)
    })

    it('should return 0 for FREE items regardless of quantity', () => {
      const extras: SelectedExtra[] = [
        { serviceItem: freeItem, quantity: 5 },
      ]
      expect(calculateExtrasTotal(extras, 100)).toBe(0)
    })

    it('should aggregate mixed types correctly', () => {
      const extras: SelectedExtra[] = [
        { serviceItem: flatItem, quantity: 1 },       // 1500
        { serviceItem: perPersonItem, quantity: 1 },   // 80 × 100 = 8000
        { serviceItem: freeItem, quantity: 1 },        // 0
      ]
      expect(calculateExtrasTotal(extras, 100)).toBe(9500)
    })

    it('should aggregate multiple FLAT items', () => {
      const extraFlat: ServiceItem = { ...flatItem, id: 'si-flat-2', name: 'Oświetlenie', basePrice: 800 }
      const extras: SelectedExtra[] = [
        { serviceItem: flatItem, quantity: 1 },     // 1500
        { serviceItem: extraFlat, quantity: 2 },     // 800 × 2 = 1600
      ]
      expect(calculateExtrasTotal(extras, 50)).toBe(3100)
    })

    it('should handle 0 guests for PER_PERSON items', () => {
      const extras: SelectedExtra[] = [
        { serviceItem: perPersonItem, quantity: 1 },
      ]
      expect(calculateExtrasTotal(extras, 0)).toBe(0)
    })
  })

  describe('mapExtrasToPayload (onFormSubmit mapping)', () => {
    it('should return empty array for empty extras', () => {
      const result = mapExtrasToPayload([], 100)
      expect(result).toEqual([])
    })

    it('should map FLAT item correctly', () => {
      const extras: SelectedExtra[] = [
        { serviceItem: flatItem, quantity: 2 },
      ]
      const result = mapExtrasToPayload(extras, 100)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        serviceItemId: 'si-flat',
        quantity: 2,
        unitPrice: 1500,
        totalPrice: 3000, // 1500 × 2
      })
    })

    it('should map PER_PERSON item correctly', () => {
      const extras: SelectedExtra[] = [
        { serviceItem: perPersonItem, quantity: 1 },
      ]
      const result = mapExtrasToPayload(extras, 80)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        serviceItemId: 'si-pp',
        quantity: 1,
        unitPrice: 80,
        totalPrice: 6400, // 80 × 80 × 1
      })
    })

    it('should map FREE item with unitPrice=0 and totalPrice=0', () => {
      const extras: SelectedExtra[] = [
        { serviceItem: freeItem, quantity: 1 },
      ]
      const result = mapExtrasToPayload(extras, 100)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        serviceItemId: 'si-free',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
      })
    })

    it('should preserve serviceItemId for each mapped item', () => {
      const extras: SelectedExtra[] = [
        { serviceItem: flatItem, quantity: 1 },
        { serviceItem: perPersonItem, quantity: 1 },
        { serviceItem: freeItem, quantity: 1 },
      ]
      const result = mapExtrasToPayload(extras, 100)

      expect(result.map((r) => r.serviceItemId)).toEqual([
        'si-flat',
        'si-pp',
        'si-free',
      ])
    })

    it('should map complex scenario with mixed types and quantities', () => {
      const extras: SelectedExtra[] = [
        { serviceItem: flatItem, quantity: 2 },        // 1500 × 2 = 3000
        { serviceItem: perPersonItem, quantity: 3 },   // 80 × 120 × 3 = 28800
        { serviceItem: freeItem, quantity: 1 },         // 0
      ]
      const result = mapExtrasToPayload(extras, 120)

      expect(result).toHaveLength(3)

      expect(result[0].totalPrice).toBe(3000)
      expect(result[0].unitPrice).toBe(1500)

      expect(result[1].totalPrice).toBe(28800)
      expect(result[1].unitPrice).toBe(80)

      expect(result[2].totalPrice).toBe(0)
      expect(result[2].unitPrice).toBe(0)
    })
  })

  describe('Edge cases', () => {
    it('should handle very large guest counts', () => {
      const extras: SelectedExtra[] = [
        { serviceItem: perPersonItem, quantity: 1 },
      ]
      expect(calculateExtrasTotal(extras, 10000)).toBe(800000)
    })

    it('should handle very large quantities', () => {
      const extras: SelectedExtra[] = [
        { serviceItem: flatItem, quantity: 100 },
      ]
      expect(calculateExtrasTotal(extras, 1)).toBe(150000)
    })

    it('should handle basePrice with decimals', () => {
      const decimalItem: ServiceItem = {
        ...perPersonItem,
        id: 'si-decimal',
        basePrice: 12.50,
      }
      const extras: SelectedExtra[] = [
        { serviceItem: decimalItem, quantity: 1 },
      ]
      expect(calculateExtrasTotal(extras, 10)).toBe(125) // 12.5 × 10
    })

    it('mapExtrasToPayload should not include extras when array is empty', () => {
      // Simulates the `if (selectedExtras.length > 0)` guard in onFormSubmit
      const selectedExtras: SelectedExtra[] = []
      const input: any = {}

      if (selectedExtras.length > 0) {
        input.serviceExtras = mapExtrasToPayload(selectedExtras, 100)
      }

      // serviceExtras should NOT be in the payload
      expect(input).not.toHaveProperty('serviceExtras')
    })

    it('mapExtrasToPayload should be present when extras exist', () => {
      const selectedExtras: SelectedExtra[] = [
        { serviceItem: flatItem, quantity: 1 },
      ]
      const input: any = {}

      if (selectedExtras.length > 0) {
        input.serviceExtras = mapExtrasToPayload(selectedExtras, 100)
      }

      expect(input).toHaveProperty('serviceExtras')
      expect(input.serviceExtras).toHaveLength(1)
    })
  })
})
