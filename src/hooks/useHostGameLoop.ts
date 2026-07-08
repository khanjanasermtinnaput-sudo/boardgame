import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchUnprocessedActions, type GameActionRow } from '@/lib/game'
import { processQueuedAction } from '@/net/hostLoop'
import type { GameAction } from '@/engine/actions'

export function useHostGameLoop(roomId: string | undefined, gameId: string | null, isHost: boolean): void {
  // Guards against the same game_actions row being picked up twice — once by
  // the initial backlog fetch and once by the realtime subscription, since
  // both run concurrently and could otherwise both observe the same insert.
  const seenRowIds = useRef(new Set<string>())

  useEffect(() => {
    if (!roomId || !gameId || !isHost) return

    function enqueue(row: GameActionRow) {
      if (seenRowIds.current.has(row.id)) return
      seenRowIds.current.add(row.id)

      const action = row.payload as unknown as GameAction
      processQueuedAction(roomId!, row.id, row.profile_id, action).catch((err) => {
        console.error('host loop failed to process action', row.id, err)
      })
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
