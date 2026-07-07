import { describe, it, expect } from 'vitest'
import { createInitialGameState, createInitialPlayerState } from '../createGame'
import { netWorth, totalAssets, totalLoanBalance, totalPassiveIncome, totalExpenses } from '../economy'
import { createInitialMarket } from '../market'

describe('economy', () => {
  it('computes net worth as cash + assets - liabilities', () => {
    const player = createInitialPlayerState({ id: 'p1', name: 'Alice', tokenColor: 'emerald', seat: 0 })
    const market = createInitialMarket()

    const withAssets = {
      ...player,
      cash: 1000,
      investments: [{ instrumentId: 'nova-robotics', quantity: 10, avgBuyPrice: 64 }],
      loans: [{ id: 'l1', principal: 500, balance: 500, interestRate: 0.1 }],
    }

    const assets = totalAssets(withAssets, market, 1)
    const liabilities = totalLoanBalance(withAssets)
    const nw = netWorth(withAssets, market, 1)

    expect(nw).toBeCloseTo(assets - liabilities, 5)
    expect(assets).toBeGreaterThan(1000) // cash + investment value
  })

  it('starting players have zero investments/businesses/properties/loans', () => {
    const player = createInitialPlayerState({ id: 'p1', name: 'Alice', tokenColor: 'emerald', seat: 0 })
    const market = createInitialMarket()

    expect(totalLoanBalance(player)).toBe(0)
    expect(netWorth(player, market, 1)).toBe(player.cash)
  })

  it('income includes salary, dividends, business income, and rental income', () => {
    const base = createInitialPlayerState({ id: 'p1', name: 'Alice', tokenColor: 'emerald', seat: 0 })
    const market = createInitialMarket()
    const player = {
      ...base,
      investments: [{ instrumentId: 'granite-utilities', quantity: 10, avgBuyPrice: 54 }],
      businesses: [{ templateId: 'cafe', level: 1, purchasePrice: 8000 }],
      properties: [{ id: 'prop1', templateId: 'house', purchasePrice: 50000, purchaseRound: 1 }],
    }

    const income = totalPassiveIncome(player, market)
    expect(income).toBeGreaterThan(player.salary)
  })

  it('expenses include maintenance and loan interest', () => {
    const base = createInitialPlayerState({ id: 'p1', name: 'Alice', tokenColor: 'emerald', seat: 0 })
    const player = {
      ...base,
      businesses: [{ templateId: 'cafe', level: 1, purchasePrice: 8000 }],
      loans: [{ id: 'l1', principal: 1000, balance: 1000, interestRate: 0.1 }],
    }

    const expenses = totalExpenses(player)
    expect(expenses).toBeGreaterThan(base.baseExpenses)
  })

  it('createInitialGameState produces players sorted by seat', () => {
    const state = createInitialGameState(
      [
        { id: 'p2', name: 'Bob', tokenColor: 'gold', seat: 1 },
        { id: 'p1', name: 'Alice', tokenColor: 'emerald', seat: 0 },
      ],
      { type: 'target', targetNetWorth: 1_000_000 },
    )

    expect(state.players.map((p) => p.id)).toEqual(['p1', 'p2'])
    expect(state.round).toBe(1)
    expect(state.phase).toBe('rolling')
  })
})
