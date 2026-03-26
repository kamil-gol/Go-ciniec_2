import { describe, it, expect } from 'vitest'
import {
  translateOptionCategory,
  sortCategories,
  OPTION_CATEGORY_TRANSLATIONS,
} from '@/lib/menu-utils'

// ════════════════════════════════════════════════════════════
// translateOptionCategory()
// ════════════════════════════════════════════════════════════
describe('translateOptionCategory()', () => {
  it('translates English category to Polish', () => {
    expect(translateOptionCategory('Alcohol')).toBe('Alkohol')
    expect(translateOptionCategory('Music')).toBe('Muzyka')
    expect(translateOptionCategory('Other')).toBe('Inne')
  })

  it('translates uppercase variants', () => {
    expect(translateOptionCategory('ALCOHOL')).toBe('Alkohol')
    expect(translateOptionCategory('PHOTO_VIDEO')).toBe('Foto & Video')
    expect(translateOptionCategory('ENTERTAINMENT')).toBe('Rozrywka')
  })

  it('returns original value when no translation found', () => {
    expect(translateOptionCategory('CustomCategory')).toBe('CustomCategory')
    expect(translateOptionCategory('')).toBe('')
  })

  it('covers all expected categories', () => {
    const expectedKeys = [
      'Alcohol', 'Animations', 'Decorations', 'Additions', 'Additional',
      'Photo & Video', 'Music', 'Entertainment', 'Food', 'Drinks',
      'Services', 'Equipment', 'Other',
    ]
    for (const key of expectedKeys) {
      expect(OPTION_CATEGORY_TRANSLATIONS[key]).toBeDefined()
    }
  })
})

// ════════════════════════════════════════════════════════════
// sortCategories()
// ════════════════════════════════════════════════════════════
describe('sortCategories()', () => {
  it('sorts preferred categories in correct order', () => {
    const input = ['Dekoracje', 'Alkohol', 'Muzyka']
    const result = sortCategories([...input])
    expect(result).toEqual(['Alkohol', 'Muzyka', 'Dekoracje'])
  })

  it('places preferred categories before non-preferred', () => {
    const input = ['Zzz Custom', 'Alkohol', 'Aaa Custom']
    const result = sortCategories([...input])
    expect(result[0]).toBe('Alkohol')
  })

  it('sorts non-preferred categories alphabetically', () => {
    const input = ['Zzz', 'Aaa', 'Mmm']
    const result = sortCategories([...input])
    expect(result).toEqual(['Aaa', 'Mmm', 'Zzz'])
  })

  it('handles empty array', () => {
    expect(sortCategories([])).toEqual([])
  })

  it('handles single element', () => {
    expect(sortCategories(['Alkohol'])).toEqual(['Alkohol'])
  })

  it('preserves all preferred order when all present', () => {
    const all = [
      'Sprzęt', 'Usługi', 'Dodatki', 'Napoje', 'Jedzenie',
      'Rozrywka', 'Dekoracje', 'Animacje', 'Foto & Video', 'Muzyka', 'Alkohol',
    ]
    const result = sortCategories([...all])
    expect(result[0]).toBe('Alkohol')
    expect(result[1]).toBe('Muzyka')
    expect(result[2]).toBe('Foto & Video')
    expect(result[result.length - 1]).toBe('Sprzęt')
  })
})
