import type { GameState } from './types'
import { netWorth, totalAssets, totalLoanBalance, totalPassiveIncome } from './economy'

export function evaluateWinner(state: GameState): string | undefined {
  const activePlayers = state.players.filter((p) => !p.bankrupt)

  if (state.winCondition.type === 'survival') {
    if (state.players.length > 1 && activePlayers.length <= 1) {
      return activePlayers[0]?.id
    }
    return undefined
  }

  if (state.winCondition.type === 'target') {
    const target = state.winCondition.targetNetWorth
    const winner = activePlayers.find((p) => netWorth(p, state.market, state.round) >= target)
    return winner?.id
  }

  if (state.winCondition.type === 'rounds') {
    if (state.round > state.winCondition.totalRounds) {
      const ranked = [...activePlayers].sort(
        (a, b) => netWorth(b, state.market, state.round) - netWorth(a, state.market, state.round),
      )
      return ranked[0]?.id
    }
    return undefined
  }

  return undefined
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
