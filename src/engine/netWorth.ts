// Pure calculation mirror of the server-side RPC logic (see
// supabase/migrations/0012-0016). Used for client-side display and
// prediction (e.g. "you can afford this", showing a live net worth as the
// player reviews their portfolio) — the server RPCs are always the
// authoritative source of truth and re-derive every one of these values
// themselves rather than trusting anything computed here.
import type { CardCategory } from '@/content/cards'
import type { AssetInstance, DebtCard, MarketMultipliers } from './types'

export const STARTING_CASH = 10000
export const STARTING_SALARY = 2000
export const MAX_HAND_SIZE = 4
export const MIN_AGE = 20
export const MAX_AGE = 70
export const AGE_STEP = 10

export const MARKET_MULTIPLIER_MIN = 0.2
export const MARKET_MULTIPLIER_MAX = 3.0

export const SELL_RATE = 0.9
export const MAINTENANCE_RATE = 0.02
export const TAX_RATE = 0.15
export const BASE_LIVING_COST = 800
export const LIVING_COST_PER_DECADE = 200

export function marketMultiplierFor(market: MarketMultipliers, category: CardCategory): number {
  return market[category] ?? 1.0
}

export function buyPrice(purchasePrice: number, market: MarketMultipliers, category: CardCategory): number {
  return Math.round(purchasePrice * marketMultiplierFor(market, category))
}

export function sellPrice(baseValue: number, market: MarketMultipliers, category: CardCategory): number {
  return Math.round(baseValue * marketMultiplierFor(market, category) * SELL_RATE)
}

export function totalAssetBaseValue(assets: AssetInstance[]): number {
  return assets.reduce((sum, a) => sum + a.base_value, 0)
}

export function totalPassiveIncome(assets: AssetInstance[]): number {
  return assets.reduce((sum, a) => sum + a.passive_income, 0)
}

export function totalOutstandingDebt(debts: DebtCard[]): number {
  return debts.reduce((sum, d) => sum + d.outstanding, 0)
}

export function computeNetWorth(cash: number, assets: AssetInstance[], debts: DebtCard[]): number {
  return cash + totalAssetBaseValue(assets) - totalOutstandingDebt(debts)
}

/** Interest rate scales with the number of simultaneous debt cards carried. */
export function interestRateForDebtCount(debtCount: number): number {
  if (debtCount <= 0) return 0
  if (debtCount === 1) return 0.05
  if (debtCount === 2) return 0.1
  if (debtCount === 3) return 0.2
  if (debtCount === 4) return 0.3
  if (debtCount === 5) return 0.4
  if (debtCount === 6) return 0.5
  return 0.5 + 0.05 * (debtCount - 6)
}

export function livingCostForAge(age: number): number {
  return Math.round(BASE_LIVING_COST + ((age - MIN_AGE) / AGE_STEP) * LIVING_COST_PER_DECADE)
}

export function maintenanceFor(assets: AssetInstance[]): number {
  return Math.round(totalAssetBaseValue(assets) * MAINTENANCE_RATE)
}

export function taxFor(grossIncome: number): number {
  return Math.round(grossIncome * TAX_RATE)
}

export function clampMultiplier(value: number): number {
  return Math.min(MARKET_MULTIPLIER_MAX, Math.max(MARKET_MULTIPLIER_MIN, value))
}

export function applyMarketEffects(market: MarketMultipliers, effects: Partial<Record<CardCategory, number>>): MarketMultipliers {
  const next = { ...market }
  for (const key of Object.keys(effects) as CardCategory[]) {
    const current = market[key] ?? 1.0
    const delta = effects[key] ?? 1.0
    next[key] = clampMultiplier(current * delta)
  }
  return next
}

export function isLastAge(age: number): boolean {
  return age >= MAX_AGE
}

export function nextAge(age: number): number {
  return age + AGE_STEP
}
