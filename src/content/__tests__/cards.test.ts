import { describe, expect, it } from 'vitest'
import { CARD_CATALOG, CATEGORY_ICONS, CATEGORY_LABELS, type CardCategory } from '../cards'

const ALL_CATEGORIES: CardCategory[] = [
  'house',
  'business',
  'growth_stock',
  'dividend_stock',
  'gold',
  'car',
  'land',
  'commercial_building',
  'crypto',
  'special_asset',
]

describe('CATEGORY_ICONS', () => {
  it('has an icon for every card category', () => {
    for (const category of ALL_CATEGORIES) {
      expect(CATEGORY_ICONS[category]).toBeTruthy()
    }
  })

  it('has exactly the same keys as CATEGORY_LABELS', () => {
    expect(Object.keys(CATEGORY_ICONS).sort()).toEqual(Object.keys(CATEGORY_LABELS).sort())
  })

  it('every catalog card category has a mapped icon', () => {
    for (const card of CARD_CATALOG) {
      expect(CATEGORY_ICONS[card.category]).toBeTruthy()
    }
  })
})
