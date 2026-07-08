import { create } from 'zustand'
import type { GameState } from '@/engine/types'

export type GameSyncStatus = 'loading' | 'ready' | 'not_found' | 'error'

interface GameStoreState {
  gameId: string | null
  state: GameState | null
  status: GameSyncStatus
  setGameId: (id: string | null) => void
  setState: (state: GameState) => void
  setStatus: (status: GameSyncStatus) => void
  reset: () => void
}

export const useGameStore = create<GameStoreState>((set) => ({
  gameId: null,
  state: null,
  status: 'loading',
  setGameId: (gameId) => set({ gameId }),
  setState: (state) => set({ state, status: 'ready' }),
  setStatus: (status) => set({ status }),
  reset: () => set({ gameId: null, state: null, status: 'loading' }),
}))
