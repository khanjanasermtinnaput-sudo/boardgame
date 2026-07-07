import type { MarketState, MarketRegimeType } from './types'
import { INVESTMENTS } from '@/content/investments'
import { MARKET_REGIMES, MARKET_REGIME_TYPES } from '@/content/marketRegimes'

export const MARKET_TICK_ROUNDS = 3
export const BASE_INTEREST_RATE = 0.04

export function createInitialMarket(): MarketState {
  const prices: Record<string, number> = {}
  for (const inv of INVESTMENTS) {
    prices[inv.id] = inv.basePrice
  }
  return {
    regime: 'bull',
    roundsRemaining: MARKET_TICK_ROUNDS,
    interestRate: BASE_INTEREST_RATE,
    prices,
    propertyIndex: 1,
  }
}

function randomRegime(exclude: MarketRegimeType): MarketRegimeType {
  const candidates = MARKET_REGIME_TYPES.filter((r) => r !== exclude)
  return candidates[Math.floor(Math.random() * candidates.length)] ?? exclude
}

function gaussianShock(volatility: number): number {
  // Box-Muller transform for a roughly-normal shock scaled by volatility.
  const u1 = Math.max(Number.EPSILON, Math.random())
  const u2 = Math.random()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return z * volatility
}

export function applyMarketTick(market: MarketState, forcedRegime?: MarketRegimeType): MarketState {
  const nextRegime = forcedRegime ?? randomRegime(market.regime)
  const regimeDef = MARKET_REGIMES[nextRegime]

  const nextPrices: Record<string, number> = {}
  for (const inv of INVESTMENTS) {
    const currentPrice = market.prices[inv.id] ?? inv.basePrice
    const categoryMult = regimeDef.categoryMultipliers[inv.category]
    const drift = 1 + inv.baseReturn * (categoryMult - 1) * 0.5 + gaussianShock(inv.volatility)
    const nextPrice = Math.max(1, currentPrice * categoryMult * drift)
    nextPrices[inv.id] = Math.round(nextPrice * 100) / 100
  }

  const nextInterestRate = Math.max(0.005, market.interestRate + regimeDef.interestRateDelta)
  const nextPropertyIndex = market.propertyIndex * regimeDef.propertyMultiplier

  return {
    regime: nextRegime,
    roundsRemaining: MARKET_TICK_ROUNDS,
    interestRate: nextInterestRate,
    prices: nextPrices,
    propertyIndex: nextPropertyIndex,
  }
}

export function tickMarketCountdown(market: MarketState): MarketState {
  if (market.roundsRemaining <= 1) {
    return applyMarketTick(market)
  }
  return { ...market, roundsRemaining: market.roundsRemaining - 1 }
}
