import type { EventCard, EventEffect, MarketState, PlayerState } from './types'
import { EVENT_CARDS } from '@/content/events'
import { netWorth } from './economy'
import { mitigateLoss } from './insurance'
import { sellInvestment } from './investments'
import { sellBusiness } from './businesses'
import { sellProperty } from './realEstate'
import { applyMarketTick } from './market'
import { BOARD_SIZE } from '@/content/board'

export function drawRandomEventCard(): EventCard {
  const card = EVENT_CARDS[Math.floor(Math.random() * EVENT_CARDS.length)]
  if (!card) throw new Error('event_card_pool_empty')
  return card
}

function signedCashDelta(player: PlayerState, rawAmount: number): number {
  return rawAmount < 0 ? -mitigateLoss(player, -rawAmount) : rawAmount
}

function forceSellRandomAsset(player: PlayerState, market: MarketState, currentRound: number): PlayerState {
  type Candidate = () => PlayerState
  const pool: Candidate[] = []

  if (player.investments.length > 0) {
    pool.push(() => {
      const idx = Math.floor(Math.random() * player.investments.length)
      const inv = player.investments[idx]
      if (!inv) return player
      const result = sellInvestment(player, inv.instrumentId, inv.quantity, market)
      return result.ok ? result.value : player
    })
  }
  if (player.properties.length > 0) {
    pool.push(() => {
      const idx = Math.floor(Math.random() * player.properties.length)
      const prop = player.properties[idx]
      if (!prop) return player
      const result = sellProperty(player, prop.id, market, currentRound)
      return result.ok ? result.value : player
    })
  }
  if (player.businesses.length > 0) {
    pool.push(() => {
      const idx = Math.floor(Math.random() * player.businesses.length)
      const biz = player.businesses[idx]
      if (!biz) return player
      const result = sellBusiness(player, biz.templateId)
      return result.ok ? result.value : player
    })
  }

  if (pool.length === 0) return player
  const chosen = pool[Math.floor(Math.random() * pool.length)]
  return chosen ? chosen() : player
}

function loseRandomInvestmentPercent(player: PlayerState, percent: number): PlayerState {
  if (player.investments.length === 0) return player
  const idx = Math.floor(Math.random() * player.investments.length)
  const target = player.investments[idx]
  if (!target) return player

  const newQuantity = Math.max(0, Math.floor(target.quantity * (1 - percent)))
  const investments = newQuantity > 0
    ? player.investments.map((o, i) => (i === idx ? { ...o, quantity: newQuantity } : o))
    : player.investments.filter((_, i) => i !== idx)

  return { ...player, investments }
}

// Applies a single effect to the acting player. Game-wide effects
// (market_shift) are no-ops here — see applyGameEventEffect.
export function applyPlayerEventEffect(
  player: PlayerState,
  effect: EventEffect,
  market: MarketState,
  currentRound: number,
): PlayerState {
  switch (effect.kind) {
    case 'cash_delta': {
      return { ...player, cash: player.cash + signedCashDelta(player, effect.amount ?? 0) }
    }
    case 'cash_percent_of_net_worth': {
      const raw = netWorth(player, market, currentRound) * (effect.percent ?? 0)
      return { ...player, cash: player.cash + signedCashDelta(player, raw) }
    }
    case 'cash_percent_of_cash': {
      const raw = player.cash * (effect.percent ?? 0)
      return { ...player, cash: player.cash + signedCashDelta(player, raw) }
    }
    case 'income_delta': {
      return { ...player, salary: Math.max(0, player.salary + (effect.amount ?? 0)) }
    }
    case 'expense_delta': {
      return { ...player, baseExpenses: Math.max(0, player.baseExpenses + (effect.amount ?? 0)) }
    }
    case 'liability_delta': {
      const amount = effect.amount ?? 0
      if (amount <= 0) return player
      const loan = { id: crypto.randomUUID(), principal: amount, balance: amount, interestRate: 0.08 }
      return { ...player, loans: [...player.loans, loan] }
    }
    case 'force_sell_random_asset': {
      return forceSellRandomAsset(player, market, currentRound)
    }
    case 'skip_next_turn': {
      return { ...player, skipTurns: player.skipTurns + 1 }
    }
    case 'move_spaces': {
      const spaces = effect.spaces ?? 0
      const newPosition = ((player.position + spaces) % BOARD_SIZE + BOARD_SIZE) % BOARD_SIZE
      return { ...player, position: newPosition }
    }
    case 'lose_random_investment_percent': {
      return loseRandomInvestmentPercent(player, effect.percent ?? 0)
    }
    case 'market_shift':
      return player
    default:
      return player
  }
}

export function applyGameEventEffect(market: MarketState, effect: EventEffect): MarketState {
  if (effect.kind !== 'market_shift' || !effect.regime) return market
  return applyMarketTick(market, effect.regime)
}

export function applyEventCard(
  player: PlayerState,
  market: MarketState,
  card: EventCard,
  currentRound: number,
): { player: PlayerState; market: MarketState } {
  let nextPlayer = player
  let nextMarket = market
  for (const effect of card.effects) {
    nextPlayer = applyPlayerEventEffect(nextPlayer, effect, nextMarket, currentRound)
    nextMarket = applyGameEventEffect(nextMarket, effect)
  }
  return { player: nextPlayer, market: nextMarket }
}
