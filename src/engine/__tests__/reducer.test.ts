import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createInitialGameState } from '../createGame'
import { applyGameAction } from '../reducer'
import { BOARD } from '@/content/board'

function twoPlayerState() {
  return createInitialGameState(
    [
      { id: 'p1', name: 'Alice', tokenColor: 'emerald', seat: 0 },
      { id: 'p2', name: 'Bob', tokenColor: 'gold', seat: 1 },
    ],
    { type: 'rounds', totalRounds: 50 },
  )
}

describe('reducer turn flow', () => {
  it('rejects actions from a player who is not up', () => {
    const state = twoPlayerState()
    const result = applyGameAction(state, 'p2', { type: 'ROLL_DICE' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('not_your_turn')
  })

  it('ROLL_DICE moves the current player and transitions to the action phase', () => {
    const state = twoPlayerState()
    const result = applyGameAction(state, 'p1', { type: 'ROLL_DICE' })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const player = result.value.players.find((p) => p.id === 'p1')!
    expect(player.position).toBeGreaterThan(0)
    expect(player.position).toBeLessThan(BOARD.length)
    expect(['action', 'ended']).toContain(result.value.phase)
  })

  it('rejects a second ROLL_DICE before the turn ends (unless still rolling)', () => {
    const state = twoPlayerState()
    const rolled = applyGameAction(state, 'p1', { type: 'ROLL_DICE' })
    expect(rolled.ok).toBe(true)
    if (!rolled.ok) return

    // If landed on an event space, ack it first for a deterministic re-check.
    let s = rolled.value
    if (s.pendingEventCardId) {
      const acked = applyGameAction(s, 'p1', { type: 'ACK_EVENT_CARD' })
      expect(acked.ok).toBe(true)
      if (acked.ok) s = acked.value
    }

    const secondRoll = applyGameAction(s, 'p1', { type: 'ROLL_DICE' })
    expect(secondRoll.ok).toBe(false)
  })

  it('a full buy -> sell investment cycle works within the action phase', () => {
    let state = twoPlayerState()
    // Force into the action phase deterministically without relying on the dice roll.
    state = { ...state, phase: 'action' as const }

    const buy = applyGameAction(state, 'p1', { type: 'BUY_INVESTMENT', instrumentId: 'nova-robotics', quantity: 10 })
    expect(buy.ok).toBe(true)
    if (!buy.ok) return

    const afterBuy = buy.value.players.find((p) => p.id === 'p1')!
    expect(afterBuy.investments).toHaveLength(1)
    expect(afterBuy.cash).toBeLessThan(state.players[0]!.cash)

    const sell = applyGameAction(buy.value, 'p1', { type: 'SELL_INVESTMENT', instrumentId: 'nova-robotics', quantity: 10 })
    expect(sell.ok).toBe(true)
    if (!sell.ok) return

    const afterSell = sell.value.players.find((p) => p.id === 'p1')!
    expect(afterSell.investments).toHaveLength(0)
  })

  it('rejects buying an investment beyond available cash', () => {
    let state = twoPlayerState()
    state = { ...state, phase: 'action' as const }
    const result = applyGameAction(state, 'p1', { type: 'BUY_INVESTMENT', instrumentId: 'nova-robotics', quantity: 100_000 })
    expect(result.ok).toBe(false)
  })

  it('END_TURN advances to the next player', () => {
    let state = twoPlayerState()
    state = { ...state, phase: 'action' as const, lastRoll: [1, 2] }
    const result = applyGameAction(state, 'p1', { type: 'END_TURN' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.turnIndex).toBe(1)
    expect(result.value.phase).toBe('rolling')
  })

  it('END_TURN with doubles grants the same player another turn', () => {
    let state = twoPlayerState()
    state = { ...state, phase: 'action' as const, lastRoll: [4, 4], doublesStreak: 1 }
    const result = applyGameAction(state, 'p1', { type: 'END_TURN' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.turnIndex).toBe(0)
    expect(result.value.phase).toBe('rolling')
  })

  it('completing a full lap around the board settles payday income/expenses', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99) // forces max dice rolls (6,6) each call
    let state = twoPlayerState()
    state = {
      ...state,
      players: state.players.map((p) => (p.id === 'p1' ? { ...p, position: 38, cash: 1000 } : p)),
    }

    const result = applyGameAction(state, 'p1', { type: 'ROLL_DICE' })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const player = result.value.players.find((p) => p.id === 'p1')!
    // Position 38 + 12 (6+6) wraps past Payday (position 40 % 40 = 10), so payday should settle.
    expect(player.cash).not.toBe(1000 - 0) // cash changed due to payday settlement (income - expenses applied)
    vi.restoreAllMocks()
  })
})

describe('bankruptcy and win detection via END_TURN', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('marks a player bankrupt once their cash drops below the threshold and can end the game via survival', () => {
    const state = createInitialGameState(
      [
        { id: 'p1', name: 'Alice', tokenColor: 'emerald', seat: 0 },
        { id: 'p2', name: 'Bob', tokenColor: 'gold', seat: 1 },
      ],
      { type: 'survival' },
    )

    const broke = { ...state, phase: 'action' as const, lastRoll: [1, 2] as [number, number], players: state.players.map((p) => (p.id === 'p1' ? { ...p, cash: -5000 } : p)) }
    const result = applyGameAction(broke, 'p1', { type: 'END_TURN' })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const alice = result.value.players.find((p) => p.id === 'p1')!
    expect(alice.bankrupt).toBe(true)
    expect(result.value.phase).toBe('ended')
    expect(result.value.winnerId).toBe('p2')
  })

  it('ends the game (does not soft-lock) when the last active player goes bankrupt on their own turn', () => {
    // 3-player survival game where two players are already bankrupt and the
    // third (current) player busts on END_TURN — zero active players remain.
    const state = createInitialGameState(
      [
        { id: 'p1', name: 'Alice', tokenColor: 'emerald', seat: 0 },
        { id: 'p2', name: 'Bob', tokenColor: 'gold', seat: 1 },
        { id: 'p3', name: 'Cara', tokenColor: 'sky', seat: 2 },
      ],
      { type: 'survival' },
    )

    const allButOneBroke = {
      ...state,
      phase: 'action' as const,
      lastRoll: [1, 2] as [number, number],
      turnIndex: 0,
      players: state.players.map((p) => {
        if (p.id === 'p1') return { ...p, cash: -5000 }
        return { ...p, bankrupt: true }
      }),
    }

    const result = applyGameAction(allButOneBroke, 'p1', { type: 'END_TURN' })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    // The game must end rather than looping turns forever on an all-bankrupt table.
    expect(result.value.phase).toBe('ended')
  })
})
