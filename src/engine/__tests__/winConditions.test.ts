import { describe, it, expect } from 'vitest'
import { createInitialGameState } from '../createGame'
import { buildFinalResults, evaluateOutcome, evaluateWinner, rankPlayers } from '../winConditions'

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

  it('rounds: a genuine tie for first place is reported via evaluateOutcome, not silently broken', () => {
    const state = twoPlayerState({ type: 'rounds', totalRounds: 10 })
    // Both players hold identical net worth at the round cutoff.
    const finished = { ...state, round: 11 }
    expect(state.players[0]!.cash).toBe(state.players[1]!.cash)

    const outcome = evaluateOutcome(finished)
    expect(outcome.ended).toBe(true)
    expect(outcome.winnerId).toBeUndefined()
    expect(outcome.tiedPlayerIds).toEqual(expect.arrayContaining(['p1', 'p2']))
    expect(outcome.tiedPlayerIds).toHaveLength(2)
  })

  it('target: a simultaneous tie above the target reports both crossers as tied, not an arbitrary sole winner', () => {
    const state = twoPlayerState({ type: 'target', targetNetWorth: 10_000 })
    const bothCross = {
      ...state,
      players: state.players.map((p) => ({ ...p, cash: 10_000 })),
    }
    const outcome = evaluateOutcome(bothCross)
    expect(outcome.ended).toBe(true)
    expect(outcome.winnerId).toBeUndefined()
    expect(outcome.tiedPlayerIds).toHaveLength(2)
  })

  it('survival: mutual elimination (0 active players) ends the game as a draw instead of soft-locking', () => {
    const state = twoPlayerState({ type: 'survival' })
    const allBankrupt = { ...state, players: state.players.map((p) => ({ ...p, bankrupt: true })) }
    const outcome = evaluateOutcome(allBankrupt)
    expect(outcome.ended).toBe(true)
    expect(outcome.winnerId).toBeUndefined()
  })

  it('buildFinalResults marks only the actual winner as won, from server-trusted state (F1 regression guard)', () => {
    const state = twoPlayerState({ type: 'rounds', totalRounds: 20 })
    const ended = {
      ...state,
      phase: 'ended' as const,
      winnerId: 'p2',
      players: state.players.map((p) => (p.id === 'p2' ? { ...p, cash: p.cash + 10_000 } : p)),
    }

    const results = buildFinalResults(ended)
    expect(results['p1']!.won).toBe(false)
    expect(results['p2']!.won).toBe(true)
    // A loser cannot claim a higher net worth than the engine actually computed.
    const ranking = rankPlayers(ended)
    expect(results['p1']!.net_worth).toBe(Math.round(ranking.find((r) => r.playerId === 'p1')!.netWorth))
    expect(results['p2']!.net_worth).toBe(Math.round(ranking.find((r) => r.playerId === 'p2')!.netWorth))
  })

  it('buildFinalResults marks every co-leader as won on a tie, no one else', () => {
    const state = twoPlayerState({ type: 'rounds', totalRounds: 20 })
    const tied = { ...state, phase: 'ended' as const, tiedPlayerIds: ['p1', 'p2'] }
    const results = buildFinalResults(tied)
    expect(results['p1']!.won).toBe(true)
    expect(results['p2']!.won).toBe(true)
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
