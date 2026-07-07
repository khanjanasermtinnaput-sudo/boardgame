import type { MarketState, PlayerState } from './types'
import { BUSINESSES_BY_ID } from '@/content/businesses'
import { PROPERTIES_BY_ID } from '@/content/properties'
import { INVESTMENTS } from '@/content/investments'
import { MARKET_REGIMES } from '@/content/marketRegimes'
import { INSURANCE_PREMIUM_PER_ROUND } from './insurance'

const INVESTMENTS_MAP = new Map(INVESTMENTS.map((inv) => [inv.id, inv]))

export function investmentMarketValue(instrumentId: string, market: MarketState): number {
  return market.prices[instrumentId] ?? 0
}

export function totalInvestmentsValue(player: PlayerState, market: MarketState): number {
  return player.investments.reduce(
    (sum, owned) => sum + investmentMarketValue(owned.instrumentId, market) * owned.quantity,
    0,
  )
}

export function businessCurrentValue(templateId: string, level: number): number {
  const template = BUSINESSES_BY_ID.get(templateId)
  if (!template) return 0
  return template.purchasePrice + (level - 1) * template.upgradeCost
}

export function totalBusinessesValue(player: PlayerState): number {
  return player.businesses.reduce((sum, owned) => sum + businessCurrentValue(owned.templateId, owned.level), 0)
}

export function propertyCurrentValue(templateId: string, purchaseRound: number, market: MarketState, currentRound: number): number {
  const template = PROPERTIES_BY_ID.get(templateId)
  if (!template) return 0
  const roundsHeld = Math.max(0, currentRound - purchaseRound)
  return template.purchasePrice * market.propertyIndex * (1 + template.appreciationRate) ** roundsHeld
}

export function totalPropertiesValue(player: PlayerState, market: MarketState, currentRound: number): number {
  return player.properties.reduce(
    (sum, owned) => sum + propertyCurrentValue(owned.templateId, owned.purchaseRound, market, currentRound),
    0,
  )
}

export function totalLoanBalance(player: PlayerState): number {
  return player.loans.reduce((sum, loan) => sum + loan.balance, 0)
}

export function totalAssets(player: PlayerState, market: MarketState, currentRound: number): number {
  return (
    player.cash +
    totalInvestmentsValue(player, market) +
    totalBusinessesValue(player) +
    totalPropertiesValue(player, market, currentRound)
  )
}

export function netWorth(player: PlayerState, market: MarketState, currentRound: number): number {
  return totalAssets(player, market, currentRound) - totalLoanBalance(player)
}

export function totalPassiveIncome(player: PlayerState, market: MarketState): number {
  const regime = MARKET_REGIMES[market.regime]

  const dividendIncome = player.investments.reduce((sum, owned) => {
    const instrument = INVESTMENTS_MAP.get(owned.instrumentId)
    if (!instrument) return sum
    const price = investmentMarketValue(owned.instrumentId, market)
    return sum + price * owned.quantity * instrument.dividendYield
  }, 0)

  const businessIncome = player.businesses.reduce((sum, owned) => {
    const template = BUSINESSES_BY_ID.get(owned.templateId)
    if (!template) return sum
    const income = template.baseIncome + (owned.level - 1) * template.upgradeIncomeBoost
    return sum + income * regime.businessIncomeMultiplier
  }, 0)

  const rentalIncome = player.properties.reduce((sum, owned) => {
    const template = PROPERTIES_BY_ID.get(owned.templateId)
    if (!template) return sum
    return sum + template.baseRentalIncome * regime.propertyMultiplier
  }, 0)

  return player.salary + dividendIncome + businessIncome + rentalIncome
}

export function totalExpenses(player: PlayerState): number {
  const businessMaintenance = player.businesses.reduce((sum, owned) => {
    const template = BUSINESSES_BY_ID.get(owned.templateId)
    if (!template) return sum
    return sum + template.maintenance * owned.level
  }, 0)

  const propertyMaintenance = player.properties.reduce((sum, owned) => {
    const template = PROPERTIES_BY_ID.get(owned.templateId)
    return sum + (template?.maintenance ?? 0)
  }, 0)

  const loanInterest = player.loans.reduce((sum, loan) => sum + loan.balance * loan.interestRate, 0)
  const insurancePremium = player.insured ? INSURANCE_PREMIUM_PER_ROUND : 0

  return player.baseExpenses + businessMaintenance + propertyMaintenance + loanInterest + insurancePremium
}

export function netCashFlow(player: PlayerState, market: MarketState): number {
  return totalPassiveIncome(player, market) - totalExpenses(player)
}
