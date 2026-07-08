import type { GameAction } from '@/engine/actions'
import { hostApplyAction } from './hostLoop'
import { submitGameAction } from '@/lib/game'

export interface DispatchContext {
  roomId: string
  gameId: string
  profileId: string
  isHost: boolean
}

export interface DispatchResult {
  ok: boolean
  error?: string
}

// Host applies (and persists) immediately for instant feedback. Non-host
// players submit an intent row; the host's game-action loop (useHostGameLoop)
// picks it up, applies it, and the resulting state reaches everyone via the
// realtime `games` subscription (useGameSync). A failed INSERT here throws
// and propagates to the caller (see GameScreen's dispatch try/catch). A
// non-host action that the host later rejects (e.g. a stale "not your turn"
// due to a race) has no round-trip acknowledgement — the caller only ever
// sees the resulting synced GameState, not a rejection reason. Building a
// full ack channel for that edge case wasn't judged worth the complexity
// here since the UI already only exposes actions during the acting player's
// own turn.
export async function dispatchGameAction(ctx: DispatchContext, action: GameAction): Promise<DispatchResult> {
  if (ctx.isHost) {
    const result = await hostApplyAction(ctx.roomId, ctx.profileId, action)
    return result.ok ? { ok: true } : { ok: false, error: result.error }
  }

  await submitGameAction(ctx.gameId, ctx.profileId, action)
  return { ok: true }
}
