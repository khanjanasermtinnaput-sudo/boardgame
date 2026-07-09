import { create } from 'zustand'
import type { Game, GamePlayer } from '@/lib/game'

export interface HistoryEntry {
  id: string
  age: number
  kind: 'global_event' | 'personal_event' | 'income_summary' | 'host_action'
  title: string
  description: string
}

interface GameState {
  game: Game | null
  players: Record<string, GamePlayer>
  history: HistoryEntry[]
  setGame: (game: Game | null) => void
  upsertPlayer: (player: GamePlayer) => void
  setPlayers: (players: GamePlayer[]) => void
  pushHistory: (entry: HistoryEntry) => void
  reset: () => void
}

export const useGameStore = create<GameState>((set) => ({
  game: null,
  players: {},
  history: [],
  setGame: (game) => set({ game }),
  upsertPlayer: (player) => set((s) => ({ players: { ...s.players, [player.profile_id]: player } })),
  setPlayers: (players) =>
    set({ players: Object.fromEntries(players.map((p) => [p.profile_id, p])) }),
  pushHistory: (entry) =>
    set((s) => (s.history.some((h) => h.id === entry.id) ? s : { history: [...s.history, entry] })),
  reset: () => set({ game: null, players: {}, history: [] }),
}))
