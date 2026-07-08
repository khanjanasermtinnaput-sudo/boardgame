import type { GameState, PlayerState, WinCondition } from './types'
import { createInitialMarket } from './market'

export const STARTING_CASH = 5000
export const STARTING_SALARY = 900
export const STARTING_EXPENSES = 500

export interface NewPlayerInput {
  id: string
  name: string
  tokenColor: string
  seat: number
}

export function createInitialPlayerState(input: NewPlayerInput): PlayerState {
  return {
    id: input.id,
    name: input.name,
    tokenColor: input.tokenColor,
    seat: input.seat,
    position: 0,
    cash: STARTING_CASH,
    salary: STARTING_SALARY,
    baseExpenses: STARTING_EXPENSES,
    investments: [],
    businesses: [],
    properties: [],
    loans: [],
    insured: false,
    educated: false,
    skipTurns: 0,
    bankrupt: false,
  }
}

export function createInitialGameState(players: NewPlayerInput[], winCondition: WinCondition): GameState {
  const sortedPlayers = [...players].sort((a, b) => a.seat - b.seat)

  return {
    players: sortedPlayers.map(createInitialPlayerState),
    turnNumber: 0,
    round: 1,
    turnIndex: 0,
    market: createInitialMarket(),
    log: [{ seq: 0, message: 'The game begins. Good luck!', timestamp: Date.now() }],
    winCondition,
    phase: 'rolling',
    doublesStreak: 0,
  }
}
