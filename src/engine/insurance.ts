import type { PlayerState } from './types'

export const INSURANCE_PREMIUM_PER_ROUND = 150
export const INSURANCE_COVERAGE_PERCENT = 0.5

export function buyInsurance(player: PlayerState): PlayerState {
  if (player.insured) return player
  return { ...player, insured: true }
}

export function cancelInsurance(player: PlayerState): PlayerState {
  if (!player.insured) return player
  return { ...player, insured: false }
}

export function mitigateLoss(player: PlayerState, rawLoss: number): number {
  if (!player.insured || rawLoss <= 0) return rawLoss
  return rawLoss * (1 - INSURANCE_COVERAGE_PERCENT)
}
