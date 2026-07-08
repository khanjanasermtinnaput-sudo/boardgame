import { create } from 'zustand'
import type { ChatMessage, Room, RoomPlayer } from '@/lib/rooms'
import type { Profile } from '@/lib/auth'

interface RoomState {
  room: Room | null
  players: RoomPlayer[]
  profiles: Record<string, Profile>
  messages: ChatMessage[]
  presentProfileIds: Set<string>
  setRoom: (room: Room | null) => void
  setPlayers: (players: RoomPlayer[]) => void
  upsertPlayer: (player: RoomPlayer) => void
  removePlayerByRowId: (id: string) => void
  mergeProfiles: (profiles: Record<string, Profile>) => void
  setMessages: (messages: ChatMessage[]) => void
  addMessage: (message: ChatMessage) => void
  setPresentProfileIds: (ids: Set<string>) => void
  reset: () => void
}

export const useRoomStore = create<RoomState>((set) => ({
  room: null,
  players: [],
  profiles: {},
  messages: [],
  presentProfileIds: new Set(),
  setRoom: (room) => set({ room }),
  setPlayers: (players) => set({ players }),
  upsertPlayer: (player) =>
    set((s) => {
      const exists = s.players.some((p) => p.id === player.id)
      return {
        players: exists ? s.players.map((p) => (p.id === player.id ? player : p)) : [...s.players, player],
      }
    }),
  removePlayerByRowId: (id) => set((s) => ({ players: s.players.filter((p) => p.id !== id) })),
  mergeProfiles: (profiles) => set((s) => ({ profiles: { ...s.profiles, ...profiles } })),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((s) => (s.messages.some((m) => m.id === message.id) ? s : { messages: [...s.messages, message] })),
  setPresentProfileIds: (ids) => set({ presentProfileIds: ids }),
  reset: () => set({ room: null, players: [], profiles: {}, messages: [], presentProfileIds: new Set() }),
}))
