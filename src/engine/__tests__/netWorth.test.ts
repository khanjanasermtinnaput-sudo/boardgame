import { describe, expect, it } from 'vitest'
import {
  applyMarketEffects,
  buyPrice,
  computeNetWorth,
  interestRateForDebtCount,
  isLastAge,
  livingCostForAge,
  maintenanceFor,
  MAX_HAND_SIZE,
  nextAge,
  sellPrice,
  taxFor,
  totalOutstandingDebt,
  totalPassiveIncome,
} from '../netWorth'
import type { AssetInstance, DebtCard } from '../types'

function asset(overrides: Partial<AssetInstance> = {}): AssetInstance {
  return {
    instance_id: 'i1',
    card_id: 'house_1',
    name: 'Suburban Starter House',
    category: 'house',
    base_value: 15000,
    passive_income: 550,
    bought_at_price: 15000,
    acquired_age: 20,
    ...overrides,
  }
}

function debt(overrides: Partial<DebtCard> = {}): DebtCard {
  return { debt_id: 'd1', principal: 1000, outstanding: 1000, created_age: 20, ...overrides }
}

describe('computeNetWorth', () => {
  it('is cash + base value of assets - outstanding debt', () => {
    const assets = [asset({ base_value: 15000 }), asset({ instance_id: 'i2', base_value: 5000 })]
    const debts = [debt({ outstanding: 3000 })]
    expect(computeNetWorth(10000, assets, debts)).toBe(10000 + 20000 - 3000)
  })

  it('is unaffected by market price — only base_value counts', () => {
    // bought_at_price differs wildly from base_value; net worth must ignore it
    const assets = [asset({ base_value: 15000, bought_at_price: 45000 })]
    expect(computeNetWorth(0, assets, [])).toBe(15000)
  })

  it('handles zero assets and zero debts', () => {
    expect(computeNetWorth(500, [], [])).toBe(500)
  })

  it('can go negative when debt exceeds cash + assets', () => {
    expect(computeNetWorth(100, [], [debt({ outstanding: 5000 })])).toBe(100 - 5000)
  })
})

describe('interestRateForDebtCount', () => {
  it('matches the spec table exactly for 0-6 cards', () => {
    expect(interestRateForDebtCount(0)).toBe(0)
    expect(interestRateForDebtCount(1)).toBe(0.05)
    expect(interestRateForDebtCount(2)).toBe(0.1)
    expect(interestRateForDebtCount(3)).toBe(0.2)
    expect(interestRateForDebtCount(4)).toBe(0.3)
    expect(interestRateForDebtCount(5)).toBe(0.4)
    expect(interestRateForDebtCount(6)).toBe(0.5)
  })

  it('adds 5% per additional card beyond 6', () => {
    expect(interestRateForDebtCount(7)).toBeCloseTo(0.55)
    expect(interestRateForDebtCount(8)).toBeCloseTo(0.6)
    expect(interestRateForDebtCount(10)).toBeCloseTo(0.7)
  })
})

describe('market pricing', () => {
  it('buyPrice applies the category multiplier and defaults to 1.0 when absent', () => {
    expect(buyPrice(10000, {}, 'house')).toBe(10000)
    expect(buyPrice(10000, { house: 1.2 }, 'house')).toBe(12000)
  })

  it('sellPrice applies the multiplier and the 90% sell rate', () => {
    expect(sellPrice(10000, { house: 1.0 }, 'house')).toBe(9000)
    expect(sellPrice(10000, { house: 1.5 }, 'house')).toBe(13500)
  })

  it('base value never changes — only used for net worth, not for buy/sell', () => {
    const a = asset({ base_value: 15000 })
    // base_value is what feeds net worth; market price for buy/sell is derived separately
    expect(computeNetWorth(0, [a], [])).toBe(15000)
    expect(sellPrice(a.base_value, { house: 2.0 }, 'house')).toBe(27000)
    expect(computeNetWorth(0, [a], [])).toBe(15000) // unchanged by the sell price calc
  })
})

describe('applyMarketEffects', () => {
  it('multiplies affected categories and clamps to [0.2, 3.0]', () => {
    const result = applyMarketEffects({ crypto: 1.0 }, { crypto: 0.1 })
    expect(result.crypto).toBe(0.2) // clamped from 0.1
  })

  it('clamps upward too', () => {
    const result = applyMarketEffects({ gold: 2.8 }, { gold: 2.0 })
    expect(result.gold).toBe(3.0) // clamped from 5.6
  })

  it('leaves unaffected categories untouched', () => {
    const result = applyMarketEffects({ house: 1.1, gold: 1.0 }, { house: 1.2 })
    expect(result.gold).toBe(1.0)
    expect(result.house).toBeCloseTo(1.32)
  })
})

describe('income & expense helpers', () => {
  it('livingCostForAge rises with age per the spec formula', () => {
    expect(livingCostForAge(20)).toBe(800)
    expect(livingCostForAge(30)).toBe(1000)
    expect(livingCostForAge(70)).toBe(1800)
  })

  it('maintenanceFor is 2% of total owned base value', () => {
    const assets = [asset({ base_value: 15000 }), asset({ instance_id: 'i2', base_value: 5000 })]
    expect(maintenanceFor(assets)).toBe(400) // 2% of 20000
  })

  it('taxFor is 15% of gross income', () => {
    expect(taxFor(4000)).toBe(600)
  })

  it('totalPassiveIncome sums every owned asset', () => {
    const assets = [asset({ passive_income: 550 }), asset({ instance_id: 'i2', passive_income: 0 })]
    expect(totalPassiveIncome(assets)).toBe(550)
  })

  it('totalOutstandingDebt sums every debt card', () => {
    const debts = [debt({ outstanding: 1000 }), debt({ debt_id: 'd2', outstanding: 2500 })]
    expect(totalOutstandingDebt(debts)).toBe(3500)
  })
})

describe('hand size', () => {
  it('is rebalanced to 4', () => {
    expect(MAX_HAND_SIZE).toBe(4)
  })
})

describe('age progression', () => {
  it('advances in steps of 10', () => {
    expect(nextAge(20)).toBe(30)
    expect(nextAge(60)).toBe(70)
  })

  it('isLastAge is true only at 70+', () => {
    expect(isLastAge(60)).toBe(false)
    expect(isLastAge(70)).toBe(true)
  })
})
