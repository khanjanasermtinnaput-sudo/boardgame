import { describe, it, expect } from 'vitest'
import { createInitialPlayerState } from '../createGame'
import { createInitialMarket } from '../market'
import { applyPlayerEventEffect, drawRandomEventCard } from '../events'
import { buyInsurance } from '../insurance'
import { EVENT_CARDS, EVENT_CARDS_BY_ID } from '@/content/events'

describe('event cards', () => {
  it('has at least 200 unique, well-formed cards across all categories', () => {
    expect(EVENT_CARDS.length).toBeGreaterThanOrEqual(200)
    expect(EVENT_CARDS_BY_ID.size).toBe(EVENT_CARDS.length)

    const categories = new Set(EVENT_CARDS.map((c) => c.category))
    expect(categories).toEqual(
      new Set(['positive', 'negative', 'neutral', 'economic', 'business', 'family', 'health', 'investment', 'tax']),
    )

    for (const card of EVENT_CARDS) {
      expect(card.title.length).toBeGreaterThan(0)
      expect(card.flavor.length).toBeGreaterThan(0)
      expect(Array.isArray(card.effects)).toBe(true)
    }
  })

  it('drawRandomEventCard always returns a valid card', () => {
    for (let i = 0; i < 50; i++) {
      const card = drawRandomEventCard()
      expect(EVENT_CARDS_BY_ID.has(card.id)).toBe(true)
    }
  })
})

describe('applyPlayerEventEffect', () => {
  const market = createInitialMarket()

  it('applies a positive cash_delta directly', () => {
    const player = createInitialPlayerState({ id: 'p1', name: 'Alice', tokenColor: 'emerald', seat: 0 })
    const next = applyPlayerEventEffect(player, { kind: 'cash_delta', amount: 500 }, market, 1)
    expect(next.cash).toBe(player.cash + 500)
  })

  it('mitigates a negative cash_delta by 50% when insured', () => {
    const base = createInitialPlayerState({ id: 'p1', name: 'Alice', tokenColor: 'emerald', seat: 0 })
    const insured = buyInsurance(base)

    const uninsuredResult = applyPlayerEventEffect(base, { kind: 'cash_delta', amount: -1000 }, market, 1)
    const insuredResult = applyPlayerEventEffect(insured, { kind: 'cash_delta', amount: -1000 }, market, 1)

    expect(base.cash - uninsuredResult.cash).toBe(1000)
    expect(base.cash - insuredResult.cash).toBe(500)
  })

  it('does not mitigate positive cash_delta even when insured', () => {
    const base = createInitialPlayerState({ id: 'p1', name: 'Alice', tokenColor: 'emerald', seat: 0 })
    const insured = buyInsurance(base)
    const next = applyPlayerEventEffect(insured, { kind: 'cash_delta', amount: 500 }, market, 1)
    expect(next.cash).toBe(insured.cash + 500)
  })

  it('skip_next_turn increments skipTurns', () => {
    const player = createInitialPlayerState({ id: 'p1', name: 'Alice', tokenColor: 'emerald', seat: 0 })
    const next = applyPlayerEventEffect(player, { kind: 'skip_next_turn' }, market, 1)
    expect(next.skipTurns).toBe(1)
  })

  it('move_spaces wraps around the board', () => {
    const base = createInitialPlayerState({ id: 'p1', name: 'Alice', tokenColor: 'emerald', seat: 0 })
    const player = { ...base, position: 38 }
    const next = applyPlayerEventEffect(player, { kind: 'move_spaces', spaces: 5 }, market, 1)
    expect(next.position).toBe(3)
  })

  it('lose_random_investment_percent reduces quantity of an owned instrument', () => {
    const base = createInitialPlayerState({ id: 'p1', name: 'Alice', tokenColor: 'emerald', seat: 0 })
    const player = { ...base, investments: [{ instrumentId: 'nova-robotics', quantity: 100, avgBuyPrice: 64 }] }
    const next = applyPlayerEventEffect(player, { kind: 'lose_random_investment_percent', percent: 0.5 }, market, 1)
    expect(next.investments[0]?.quantity).toBe(50)
  })
})
