import { describe, it, expect } from 'vitest'
import { createInitialMarket, applyMarketTick, tickMarketCountdown, MARKET_TICK_ROUNDS } from '../market'
import { INVESTMENTS } from '@/content/investments'

describe('market', () => {
  it('initial market seeds prices from investment base prices', () => {
    const market = createInitialMarket()
    for (const inv of INVESTMENTS) {
      expect(market.prices[inv.id]).toBe(inv.basePrice)
    }
    expect(market.roundsRemaining).toBe(MARKET_TICK_ROUNDS)
  })

  it('applyMarketTick can be forced to a specific regime', () => {
    const market = createInitialMarket()
    const next = applyMarketTick(market, 'crash')
    expect(next.regime).toBe('crash')
    expect(next.roundsRemaining).toBe(MARKET_TICK_ROUNDS)
    // Crash regime should push high-risk prices down on average across many trials.
  })

  it('crash regime pushes prices down more than bull regime, on average', () => {
    const trials = 200
    let crashTotal = 0
    let bullTotal = 0

    for (let i = 0; i < trials; i++) {
      const market = createInitialMarket()
      const crashed = applyMarketTick(market, 'crash')
      const bulled = applyMarketTick(market, 'bull')
      crashTotal += Object.values(crashed.prices).reduce((a, b) => a + b, 0)
      bullTotal += Object.values(bulled.prices).reduce((a, b) => a + b, 0)
    }

    expect(crashTotal).toBeLessThan(bullTotal)
  })

  it('tickMarketCountdown decrements roundsRemaining until it triggers a tick', () => {
    const market = createInitialMarket()
    const next1 = tickMarketCountdown(market)
    expect(next1.roundsRemaining).toBe(market.roundsRemaining - 1)

    const next2 = tickMarketCountdown(next1)
    expect(next2.roundsRemaining).toBe(1)

    const next3 = tickMarketCountdown(next2)
    // Countdown hit zero, so a new regime tick occurs and resets the counter.
    expect(next3.roundsRemaining).toBe(MARKET_TICK_ROUNDS)
  })

  it('never lets interest rate go negative', () => {
    let market = createInitialMarket()
    for (let i = 0; i < 50; i++) {
      market = applyMarketTick(market, 'crash')
    }
    expect(market.interestRate).toBeGreaterThanOrEqual(0.005)
  })
})
