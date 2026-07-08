import type { GameState } from './types'
import { netWorth, totalAssets, totalLoanBalance, totalPassiveIncome } from './economy'

export interface GameOutcome {
  ended: boolean
  winnerId?: string
  tiedPlayerIds?: string[]
}

const NOT_ENDED: GameOutcome = { ended: false }

// Resolves the top-ranked-by-net-worth subset of a player list into an
// outcome: a sole winner, a co-leader tie, or (empty input) a winnerless draw.
function resolveByNetWorth(candidates: GameState['players'], market: GameState['market'], round: number): GameOutcome {
  if (candidates.length === 0) return { ended: true }

  const ranked = [...candidates].sort((a, b) => netWorth(b, market, round) - netWorth(a, market, round))
  const topNetWorth = netWorth(ranked[0]!, market, round)
  const coLeaders = ranked.filter((p) => netWorth(p, market, round) === topNetWorth)

  if (coLeaders.length > 1) {
    return { ended: true, tiedPlayerIds: coLeaders.map((p) => p.id) }
  }
  return { ended: true, winnerId: ranked[0]!.id }
}

// Full outcome evaluation: whether the game has ended, and if so whether
// there is a sole winner, a tie among co-leaders, or (mutual elimination) a
// winnerless draw. `evaluateWinner` below is a thin single-id view over this
// for callers that only care about the sole-winner case.
export function evaluateOutcome(state: GameState): GameOutcome {
  const activePlayers = state.players.filter((p) => !p.bankrupt)

  if (state.winCondition.type === 'survival') {
    if (state.players.length > 1 && activePlayers.length <= 1) {
      // 1 active player left -> sole winner. 0 left (mutual elimination in
      // the same turn) -> the game still must end, just with no winner.
      if (activePlayers.length === 1) return { ended: true, winnerId: activePlayers[0]!.id }
      return { ended: true }
    }
    return NOT_ENDED
  }

  if (state.winCondition.type === 'target') {
    const target = state.winCondition.targetNetWorth
    const qualifying = activePlayers.filter((p) => netWorth(p, state.market, state.round) >= target)
    if (qualifying.length === 0) return NOT_ENDED
    return resolveByNetWorth(qualifying, state.market, state.round)
  }

  if (state.winCondition.type === 'rounds') {
    if (state.round > state.winCondition.totalRounds) {
      return resolveByNetWorth(activePlayers, state.market, state.round)
    }
    return NOT_ENDED
  }

  return NOT_ENDED
}

export function evaluateWinner(state: GameState): string | undefined {
  return evaluateOutcome(state).winnerId
}

export interface PlayerRanking {
  rank: number
  playerId: string
  name: string
  netWorth: number
  cash: number
  totalAssets: number
  totalLiabilities: number
  income: number
  businesses: number
  properties: number
  bankrupt: boolean
}

export function rankPlayers(state: GameState): PlayerRanking[] {
  const rows = state.players.map((p) => ({
    playerId: p.id,
    name: p.name,
    netWorth: netWorth(p, state.market, state.round),
    cash: p.cash,
    totalAssets: totalAssets(p, state.market, state.round),
    totalLiabilities: totalLoanBalance(p),
    income: totalPassiveIncome(p, state.market),
    businesses: p.businesses.length,
    properties: p.properties.length,
    bankrupt: p.bankrupt,
  }))

  rows.sort((a, b) => b.netWorth - a.netWorth)
  return rows.map((row, i) => ({ ...row, rank: i + 1 }))
}

export interface FinalPlayerResult {
  net_worth: number
  won: boolean
}

// Host-computed, per-player final net worth + win flag for every player in
// an ended game. Persisted alongside the final state (finish_game) so that
// submit_game_result can read each player's own result from the database
// instead of trusting a client-supplied claim.
export function buildFinalResults(state: GameState): Record<string, FinalPlayerResult> {
  const results: Record<string, FinalPlayerResult> = {}
  for (const row of rankPlayers(state)) {
    const won = row.playerId === state.winnerId || (state.tiedPlayerIds?.includes(row.playerId) ?? false)
    results[row.playerId] = { net_worth: Math.round(row.netWorth), won }
  }
  return results
}
