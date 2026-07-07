import type { ActionResult, MarketState, PlayerState } from './types'
import { INVESTMENTS_BY_ID } from '@/content/investments'
import { investmentMarketValue } from './economy'

export function buyInvestment(
  player: PlayerState,
  instrumentId: string,
  quantity: number,
  market: MarketState,
): ActionResult<PlayerState> {
  const instrument = INVESTMENTS_BY_ID.get(instrumentId)
  if (!instrument) return { ok: false, error: 'unknown_instrument' }
  if (quantity <= 0 || !Number.isFinite(quantity)) return { ok: false, error: 'invalid_quantity' }

  const price = investmentMarketValue(instrumentId, market)
  const cost = price * quantity
  if (cost > player.cash) return { ok: false, error: 'insufficient_cash' }

  const existing = player.investments.find((o) => o.instrumentId === instrumentId)
  const investments = existing
    ? player.investments.map((o) =>
        o.instrumentId === instrumentId
          ? {
              ...o,
              quantity: o.quantity + quantity,
              avgBuyPrice: (o.avgBuyPrice * o.quantity + cost) / (o.quantity + quantity),
            }
          : o,
      )
    : [...player.investments, { instrumentId, quantity, avgBuyPrice: price }]

  return { ok: true, value: { ...player, cash: player.cash - cost, investments } }
}

export function sellInvestment(
  player: PlayerState,
  instrumentId: string,
  quantity: number,
  market: MarketState,
): ActionResult<PlayerState> {
  const owned = player.investments.find((o) => o.instrumentId === instrumentId)
  if (!owned || quantity <= 0 || quantity > owned.quantity) {
    return { ok: false, error: 'invalid_sale' }
  }

  const price = investmentMarketValue(instrumentId, market)
  const proceeds = price * quantity
  const remainingQty = owned.quantity - quantity

  const investments = remainingQty > 0
    ? player.investments.map((o) => (o.instrumentId === instrumentId ? { ...o, quantity: remainingQty } : o))
    : player.investments.filter((o) => o.instrumentId !== instrumentId)

  return { ok: true, value: { ...player, cash: player.cash + proceeds, investments } }
}
