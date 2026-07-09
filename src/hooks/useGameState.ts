import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchGame, fetchGamePlayers, type Game, type GamePlayer } from '@/lib/game'
import { useGameStore } from '@/stores/gameStore'

const PHASE_NAMES: Record<number, string> = {
  1: 'Investment Phase',
  2: 'Global Event',
  3: 'Personal Event',
  4: 'Income & Expense',
  5: 'Refill Investment Cards',
}

export function phaseName(phase: number): string {
  return PHASE_NAMES[phase] ?? `Phase ${phase}`
}

export function useGameState(roomId: string | undefined, selfProfileId: string | undefined): void {
  const setGame = useGameStore((s) => s.setGame)
  const setPlayers = useGameStore((s) => s.setPlayers)
  const upsertPlayer = useGameStore((s) => s.upsertPlayer)
  const pushHistory = useGameStore((s) => s.pushHistory)
  const reset = useGameStore((s) => s.reset)
  const lastGlobalEventId = useRef<string | null>(null)

  useEffect(() => {
    if (!roomId) return
    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function load() {
      if (!roomId) return
      const game = await fetchGame(roomId)
      if (cancelled || !game) return
      setGame(game)

      const players = await fetchGamePlayers(game.id)
      if (cancelled) return
      setPlayers(players)

      channel = supabase
        .channel(`game:${game.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${game.id}` },
          (payload) => {
            const next = payload.new as Game
            setGame(next)

            const evt = next.global_event as { id?: string; name?: string; type?: string; description?: string } | null
            if (evt?.id && evt.id !== lastGlobalEventId.current) {
              lastGlobalEventId.current = evt.id
              pushHistory({
                id: `global:${evt.id}:${next.age}`,
                age: next.age,
                kind: 'global_event',
                title: evt.name ?? 'Global Event',
                description: evt.description ?? '',
              })
            }
          },
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'game_players', filter: `game_id=eq.${game.id}` },
          (payload) => {
            if (payload.eventType === 'DELETE') return
            const player = payload.new as GamePlayer
            upsertPlayer(player)

            if (player.profile_id === selfProfileId) {
              const pe = player.personal_event as { id?: string; name?: string; description?: string } | null
              if (pe?.id) {
                pushHistory({
                  id: `personal:${player.profile_id}:${pe.id}:${game.age}`,
                  age: game.age,
                  kind: 'personal_event',
                  title: pe.name ?? 'Personal Event',
                  description: pe.description ?? '',
                })
              }

              const summary = player.income_summary as { net_change?: number } | null
              if (summary && typeof summary.net_change === 'number') {
                pushHistory({
                  id: `income:${player.profile_id}:${game.age}:${game.round_no}`,
                  age: game.age,
                  kind: 'income_summary',
                  title: 'Income & Expense',
                  description: `Net change: ${summary.net_change >= 0 ? '+' : ''}${summary.net_change}`,
                })
              }
            }
          },
        )
        .subscribe()
    }

    void load()

    return () => {
      cancelled = true
      if (channel) void supabase.removeChannel(channel)
      reset()
      lastGlobalEventId.current = null
    }
  }, [roomId, selfProfileId, setGame, setPlayers, upsertPlayer, pushHistory, reset])
}
