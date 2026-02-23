import { calculateVenueSurcharge } from '../venue-surcharge'

describe('calculateVenueSurcharge', () => {
  describe('when hall is NOT whole venue', () => {
    it('returns null for a regular hall with 10 guests', () => {
      const result = calculateVenueSurcharge(false, 10)
      expect(result).toBeNull()
    })

    it('returns null for a regular hall with 50 guests', () => {
      const result = calculateVenueSurcharge(false, 50)
      expect(result).toBeNull()
    })

    it('returns null for a regular hall with 0 guests', () => {
      const result = calculateVenueSurcharge(false, 0)
      expect(result).toBeNull()
    })
  })

  describe('when hall IS whole venue', () => {
    it('returns 3000 PLN for fewer than 30 guests', () => {
      const result = calculateVenueSurcharge(true, 20)
      expect(result).not.toBeNull()
      expect(result!.amount).toBe(3000)
      expect(result!.label).toContain('poniżej 30')
    })

    it('returns 3000 PLN for exactly 29 guests (boundary)', () => {
      const result = calculateVenueSurcharge(true, 29)
      expect(result!.amount).toBe(3000)
    })

    it('returns 2000 PLN for exactly 30 guests (boundary)', () => {
      const result = calculateVenueSurcharge(true, 30)
      expect(result!.amount).toBe(2000)
      expect(result!.label).toContain('30+')
    })

    it('returns 2000 PLN for more than 30 guests', () => {
      const result = calculateVenueSurcharge(true, 100)
      expect(result!.amount).toBe(2000)
    })

    it('returns 3000 PLN for 0 guests (edge case)', () => {
      const result = calculateVenueSurcharge(true, 0)
      expect(result!.amount).toBe(3000)
    })
  })
})
