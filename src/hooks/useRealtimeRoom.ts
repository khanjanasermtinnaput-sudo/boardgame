import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchChatMessages, fetchRoom, fetchRoomPlayers, type ChatMessage, type Room, type RoomPlayer } from '@/lib/rooms'
import { fetchProfilesByIds } from '@/lib/profiles'
import { useRoomStore } from '@/stores/roomStore'

export function useRealtimeRoom(roomId: string | undefined, selfProfileId: string | undefined): void {
  const setRoom = useRoomStore((s) => s.setRoom)
  const setPlayers = useRoomStore((s) => s.setPlayers)
  const upsertPlayer = useRoomStore((s) => s.upsertPlayer)
  const removePlayerByRowId = useRoomStore((s) => s.removePlayerByRowId)
  const mergeProfiles = useRoomStore((s) => s.mergeProfiles)
  const setMessages = useRoomStore((s) => s.setMessages)
  const addMessage = useRoomStore((s) => s.addMessage)
  const setPresentProfileIds = useRoomStore((s) => s.setPresentProfileIds)
  const reset = useRoomStore((s) => s.reset)

  useEffect(() => {
    if (!roomId) return
    let cancelled = false

    async function loadInitial() {
      if (!roomId) return
      const [room, players, messages] = await Promise.all([
        fetchRoom(roomId),
        fetchRoomPlayers(roomId),
        fetchChatMessages(roomId),
      ])
      if (cancelled) return

      setRoom(room)
      setPlayers(players)
      setMessages(messages)

      const ids = [...new Set([...players.map((p) => p.profile_id), ...messages.map((m) => m.profile_id)])]
      const profiles = await fetchProfilesByIds(ids)
      if (!cancelled) mergeProfiles(profiles)
    }

    void loadInitial()

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setRoom(null)
          } else {
            setRoom(payload.new as Room)
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            removePlayerByRowId((payload.old as RoomPlayer).id)
            return
          }
          const player = payload.new as RoomPlayer
          upsertPlayer(player)
          void fetchProfilesByIds([player.profile_id]).then(mergeProfiles)
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          const message = payload.new as ChatMessage
          addMessage(message)
          void fetchProfilesByIds([message.profile_id]).then(mergeProfiles)
        },
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ profile_id: string }>()
        const ids = new Set(Object.values(state).flat().map((p) => p.profile_id))
        setPresentProfileIds(ids)
      })

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED' && selfProfileId) {
        void channel.track({ profile_id: selfProfileId, online_at: new Date().toISOString() })
      }
    })

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
      reset()
    }
  }, [
    roomId,
    selfProfileId,
    setRoom,
    setPlayers,
    upsertPlayer,
    removePlayerByRowId,
    mergeProfiles,
    setMessages,
    addMessage,
    setPresentProfileIds,
    reset,
  ])
}
