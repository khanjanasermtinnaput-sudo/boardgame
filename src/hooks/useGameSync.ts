import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchGameByRoomId, type GameRow } from '@/lib/game'
import type { GameState } from '@/engine/types'
import { useGameStore } from '@/stores/gameStore'

export function useGameSync(roomId: string | undefined): void {
  const setGameId = useGameStore((s) => s.setGameId)
  const setState = useGameStore((s) => s.setState)
  const setStatus = useGameStore((s) => s.setStatus)
  const reset = useGameStore((s) => s.reset)

  useEffect(() => {
    if (!roomId) return
    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | undefined

    async function init() {
      if (!roomId) return
      setStatus('loading')

      let game: GameRow | null
      try {
        game = await fetchGameByRoomId(roomId)
      } catch {
        if (!cancelled) setStatus('error')
        return
      }
      if (cancelled) return

      if (!game) {
        setStatus('not_found')
        return
      }

      setGameId(game.id)
      setState(game.state as unknown as GameState)

      channel = supabase
        .channel(`game:${game.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${game.id}` },
          (payload) => {
            const row = payload.new as GameRow
            setState(row.state as unknown as GameState)
          },
        )
        .subscribe()
    }

    void init()

    return () => {
      cancelled = true
      if (channel) void supabase.removeChannel(channel)
      reset()
    }
  }, [roomId, setGameId, setState, setStatus, reset])
}
