import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchUnprocessedActions, markActionProcessed, type GameActionRow } from '@/lib/game'
import { processQueuedAction } from '@/net/hostLoop'
import { isGameAction } from '@/engine/actions'

export function useHostGameLoop(roomId: string | undefined, gameId: string | null, isHost: boolean): void {
  // Guards against the same game_actions row being picked up twice — once by
  // the initial backlog fetch and once by the realtime subscription, since
  // both run concurrently and could otherwise both observe the same insert.
  // Entries are removed once processing settles (see enqueue below) so this
  // stays bounded to in-flight rows instead of growing for the whole session.
  const seenRowIds = useRef(new Set<string>())

  useEffect(() => {
    if (!roomId || !gameId || !isHost) return

    function enqueue(row: GameActionRow) {
      if (seenRowIds.current.has(row.id)) return
      seenRowIds.current.add(row.id)

      // RLS only checks who inserted the row, not that its payload matches
      // the shape its `type` claims — validate before it ever reaches the
      // reducer. A malformed row is marked processed (dropped) rather than
      // retried forever.
      if (!isGameAction(row.payload)) {
        console.error('host loop dropped malformed game_actions row', row.id, row.payload)
        markActionProcessed(row.id)
          .catch((err) => console.error('failed to mark malformed action processed', row.id, err))
          .finally(() => seenRowIds.current.delete(row.id))
        return
      }

      processQueuedAction(roomId!, row.id, row.profile_id, row.payload)
        .catch((err) => console.error('host loop failed to process action', row.id, err))
        .finally(() => seenRowIds.current.delete(row.id))
    }

    let cancelled = false

    const channel = supabase
      .channel(`game-actions:${gameId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'game_actions', filter: `game_id=eq.${gameId}` },
        (payload) => {
          enqueue(payload.new as GameActionRow)
        },
      )
      .subscribe()

    fetchUnprocessedActions(gameId).then(
      (pending) => {
        if (cancelled) return
        for (const row of pending) enqueue(row)
      },
      (err) => {
        console.error('host loop failed to fetch action backlog', err)
      },
    )

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [roomId, gameId, isHost])
}
