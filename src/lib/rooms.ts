import { supabase } from './supabase'
import type { Tables } from '@/types/database.types'
import type { WinCondition } from '@/engine/types'

export type Room = Tables<'rooms'>
export type RoomPlayer = Tables<'room_players'>
export type ChatMessage = Tables<'chat_messages'>

export interface CreateRoomParams {
  name: string
  maxPlayers: number
  isPublic: boolean
  winCondition: WinCondition
}

const ROOM_ERROR_MESSAGES: Record<string, string> = {
  room_not_found: 'No room found with that code.',
  room_full: 'That room is already full.',
  room_not_joinable: 'That game has already started.',
  not_host: 'Only the host can do that.',
  cannot_kick_self: "You can't kick yourself.",
  target_not_in_room: 'That player is no longer in the room.',
  not_authenticated: 'Your session expired — please refresh and try again.',
  not_enough_players: 'You need at least 2 players to start.',
  players_not_ready: 'Everyone needs to be ready before starting.',
  not_host_or_not_in_lobby: 'The game has already started.',
}

export function roomErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : ''
  return ROOM_ERROR_MESSAGES[raw] ?? (raw || 'Something went wrong. Please try again.')
}

export async function createRoom(params: CreateRoomParams): Promise<Room> {
  const { data, error } = await supabase.rpc('create_room', {
    _name: params.name,
    _max_players: params.maxPlayers,
    _is_public: params.isPublic,
    _win_condition: params.winCondition,
  })
  if (error) throw error
  return data
}

export async function joinRoomByCode(code: string): Promise<Room> {
  const { data, error } = await supabase.rpc('join_room', { _code: code })
  if (error) throw error
  return data
}

export async function joinPublicRoom(roomId: string): Promise<Room> {
  const { data, error } = await supabase.rpc('join_room', { _room_id: roomId })
  if (error) throw error
  return data
}

export async function joinAsSpectator(roomId: string): Promise<Room> {
  const { data, error } = await supabase.rpc('join_room', { _room_id: roomId, _as_spectator: true })
  if (error) throw error
  return data
}

export async function leaveRoom(roomId: string): Promise<void> {
  const { error } = await supabase.rpc('leave_room', { _room_id: roomId })
  if (error) throw error
}

export async function kickPlayer(roomId: string, targetProfileId: string): Promise<void> {
  const { error } = await supabase.rpc('kick_player', { _room_id: roomId, _target: targetProfileId })
  if (error) throw error
}

export async function transferHost(roomId: string, targetProfileId: string): Promise<void> {
  const { error } = await supabase.rpc('transfer_host', { _room_id: roomId, _target: targetProfileId })
  if (error) throw error
}

export async function setReady(roomId: string, profileId: string, isReady: boolean): Promise<void> {
  const { error } = await supabase
    .from('room_players')
    .update({ is_ready: isReady })
    .eq('room_id', roomId)
    .eq('profile_id', profileId)
  if (error) throw error
}

export async function setConnected(roomId: string, profileId: string, connected: boolean): Promise<void> {
  const { error } = await supabase
    .from('room_players')
    .update({ connected })
    .eq('room_id', roomId)
    .eq('profile_id', profileId)
  if (error) throw error
}

export async function listPublicRooms(): Promise<Room[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('is_public', true)
    .eq('status', 'lobby')
    .order('created_at', { ascending: false })
    .limit(30)
  if (error) throw error
  return data
}

export async function fetchRoom(roomId: string): Promise<Room | null> {
  const { data, error } = await supabase.from('rooms').select('*').eq('id', roomId).maybeSingle()
  if (error) throw error
  return data
}

export async function fetchRoomPlayers(roomId: string): Promise<RoomPlayer[]> {
  const { data, error } = await supabase
    .from('room_players')
    .select('*')
    .eq('room_id', roomId)
    .order('seat', { ascending: true })
  if (error) throw error
  return data
}

export async function sendChatMessage(roomId: string, profileId: string, body: string): Promise<void> {
  const { error } = await supabase.from('chat_messages').insert({ room_id: roomId, profile_id: profileId, body })
  if (error) throw error
}

export async function fetchChatMessages(roomId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
    .limit(200)
  if (error) throw error
  return data
}

export async function updateRoomSettings(
  roomId: string,
  updates: { name?: string; maxPlayers?: number; winCondition?: WinCondition },
): Promise<void> {
  const payload: Partial<Pick<Room, 'name' | 'max_players' | 'win_condition'>> = {}
  if (updates.name !== undefined) payload.name = updates.name
  if (updates.maxPlayers !== undefined) payload.max_players = updates.maxPlayers
  if (updates.winCondition !== undefined) payload.win_condition = updates.winCondition as unknown as Room['win_condition']
  const { error } = await supabase.from('rooms').update(payload).eq('id', roomId)
  if (error) throw error
}
