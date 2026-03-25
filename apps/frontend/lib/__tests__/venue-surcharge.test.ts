import { calculateVenueSurchargePreview, formatSurchargePLN } from '../venue-surcharge'

describe('calculateVenueSurchargePreview', () => {
  describe('when hall is NOT whole venue', () => {
    it('returns null for regular hall', () => {
      expect(calculateVenueSurchargePreview(false, 20)).toBeNull()
    })

    it('returns null for regular hall with 0 guests', () => {
      expect(calculateVenueSurchargePreview(false, 0)).toBeNull()
    })
  })

  describe('when hall IS whole venue', () => {
    it('returns 3000 for fewer than 30 guests', () => {
      const result = calculateVenueSurchargePreview(true, 15)
      expect(result).toEqual(expect.objectContaining({ amount: 3000 }))
      expect(result!.label).toContain('poniżej 30')
    })

    it('returns 3000 for exactly 29 guests (boundary)', () => {
      const result = calculateVenueSurchargePreview(true, 29)
      expect(result!.amount).toBe(3000)
    })

    it('returns 2000 for exactly 30 guests (boundary)', () => {
      const result = calculateVenueSurchargePreview(true, 30)
      expect(result).toEqual(expect.objectContaining({ amount: 2000 }))
      expect(result!.label).toContain('30+')
    })

    it('returns 2000 for more than 30 guests', () => {
      const result = calculateVenueSurchargePreview(true, 80)
      expect(result!.amount).toBe(2000)
    })

    it('returns 3000 for 0 guests (edge case)', () => {
      const result = calculateVenueSurchargePreview(true, 0)
      expect(result!.amount).toBe(3000)
    })
  })
})

describe('formatSurchargePLN', () => {
  it('formats 3000 as "3\u00a0000 zł" with Polish locale', () => {
    const result = formatSurchargePLN(3000)
    expect(result).toContain('3')
    expect(result).toContain('000')
    expect(result).toContain('zł')
  })

  it('formats 2000 correctly', () => {
    const result = formatSurchargePLN(2000)
    expect(result).toContain('2')
    expect(result).toContain('000')
    expect(result).toContain('zł')
  })
})
