import { describe, it, expect } from 'vitest'
import { createInitialGameState } from '../createGame'
import { evaluateWinner, rankPlayers } from '../winConditions'

function twoPlayerState(winCondition: Parameters<typeof createInitialGameState>[1]) {
  return createInitialGameState(
    [
      { id: 'p1', name: 'Alice', tokenColor: 'emerald', seat: 0 },
      { id: 'p2', name: 'Bob', tokenColor: 'gold', seat: 1 },
    ],
    winCondition,
  )
}

describe('win conditions', () => {
  it('target: declares a winner once someone crosses the target net worth', () => {
    const state = twoPlayerState({ type: 'target', targetNetWorth: 1_000_000 })
    expect(evaluateWinner(state)).toBeUndefined()

    const boosted = {
      ...state,
      players: state.players.map((p) => (p.id === 'p2' ? { ...p, cash: 2_000_000 } : p)),
    }
    expect(evaluateWinner(boosted)).toBe('p2')
  })

  it('rounds: only declares a winner after the round limit is exceeded', () => {
    const state = twoPlayerState({ type: 'rounds', totalRounds: 10 })
    expect(evaluateWinner(state)).toBeUndefined()

    const finished = { ...state, round: 11, players: state.players.map((p) => (p.id === 'p1' ? { ...p, cash: 9999 } : p)) }
    expect(evaluateWinner(finished)).toBe('p1')
  })

  it('survival: declares the last non-bankrupt player the winner', () => {
    const state = twoPlayerState({ type: 'survival' })
    expect(evaluateWinner(state)).toBeUndefined()

    const oneLeft = { ...state, players: state.players.map((p) => (p.id === 'p1' ? { ...p, bankrupt: true } : p)) }
    expect(evaluateWinner(oneLeft)).toBe('p2')
  })

  it('rankPlayers orders by net worth descending and assigns ranks', () => {
    const state = twoPlayerState({ type: 'rounds', totalRounds: 20 })
    const boosted = { ...state, players: state.players.map((p) => (p.id === 'p2' ? { ...p, cash: p.cash + 10_000 } : p)) }

    const ranking = rankPlayers(boosted)
    expect(ranking[0]?.playerId).toBe('p2')
    expect(ranking[0]?.rank).toBe(1)
    expect(ranking[1]?.rank).toBe(2)
  })
})
