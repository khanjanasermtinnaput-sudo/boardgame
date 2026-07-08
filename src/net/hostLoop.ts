import { applyGameAction } from '@/engine/reducer'
import type { GameAction } from '@/engine/actions'
import type { ActionResult, GameState } from '@/engine/types'
import { appendGameLog, finishGame, markActionProcessed, syncGameState } from '@/lib/game'
import { useGameStore } from '@/stores/gameStore'

async function persist(roomId: string, state: GameState): Promise<void> {
  if (state.phase === 'ended') {
    await finishGame(roomId, state)
  } else {
    const currentSeat = state.players[state.turnIndex]?.seat ?? state.turnIndex
    await syncGameState(roomId, state, state.turnNumber, state.round, currentSeat, state.market)
  }
}

// Durable per-entry audit trail, separate from the `log` array embedded in
// `games.state` — fire-and-forget so a slow write never delays the host's
// own perceived responsiveness.
function persistNewLogEntries(gameId: string, before: GameState, after: GameState): void {
  const newEntries = after.log.slice(before.log.length)
  for (const entry of newEntries) {
    void appendGameLog(gameId, entry.seq, entry).catch((err) => {
      console.error('failed to append game_log entry', entry.seq, err)
    })
  }
}

// Every mutation to the host's authoritative state — the host's own turn
// actions AND actions queued from other players — is serialized through this
// single tail so two persists (e.g. sync_game_state calls) can never race
// each other and silently clobber one another in the database.
let queueTail: Promise<void> = Promise.resolve()

function runSerialized<T>(fn: () => Promise<T>): Promise<T> {
  const result = queueTail.then(fn)
  queueTail = result.then(
    () => undefined,
    () => undefined,
  )
  return result
}

async function applyAndPersist(roomId: string, actorId: string, action: GameAction): Promise<ActionResult<GameState>> {
  const current = useGameStore.getState().state
  if (!current) return { ok: false, error: 'no_state' }

  const result = applyGameAction(current, actorId, action)
  if (!result.ok) return result

  useGameStore.getState().setState(result.value)
  await persist(roomId, result.value)

  const gameId = useGameStore.getState().gameId
  if (gameId) persistNewLogEntries(gameId, current, result.value)

  return result
}

// Applies an action to the host's authoritative in-memory state and persists
// the result. Used both for the host's own turn actions (called directly
// from the UI) and for actions submitted by other players (queued from
// useHostGameLoop's game_actions subscription) — both paths share the same
// serialized queue above.
export function hostApplyAction(roomId: string, actorId: string, action: GameAction): Promise<ActionResult<GameState>> {
  return runSerialized(() => applyAndPersist(roomId, actorId, action))
}

export function processQueuedAction(
  roomId: string,
  actionRowId: string,
  actorId: string,
  action: GameAction,
): Promise<void> {
  return runSerialized(async () => {
    await applyAndPersist(roomId, actorId, action)
    await markActionProcessed(actionRowId)
  })
}
