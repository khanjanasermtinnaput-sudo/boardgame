import { supabase } from './supabase'
import type { Tables } from '@/types/database.types'
import type { GameState } from '@/engine/types'
import type { GameAction } from '@/engine/actions'
import { buildFinalResults } from '@/engine/winConditions'

export type GameRow = Tables<'games'>
export type GameActionRow = Tables<'game_actions'>
export type GameLogRow = Tables<'game_log'>

export async function startGame(roomId: string, initialState: GameState): Promise<GameRow> {
  const { data, error } = await supabase.rpc('start_game', {
    _room_id: roomId,
    // The Supabase-generated Json type doesn't know our GameState shape,
    // but it is plain JSON-serializable data.
    _initial_state: initialState as unknown as GameRow['state'],
  })
  if (error) throw error
  return data
}

export async function syncGameState(
  roomId: string,
  state: GameState,
  turn: number,
  round: number,
  currentSeat: number,
  market: GameState['market'],
  processedActionRowId?: string,
): Promise<void> {
  // processedActionRowId marks the source game_actions row processed in the
  // same transaction as this persist — see F5 in net/hostLoop.ts.
  const { error } = await supabase.rpc('sync_game_state', {
    _room_id: roomId,
    _state: state as unknown as GameRow['state'],
    _turn: turn,
    _round: round,
    _current_seat: currentSeat,
    _market: market as unknown as GameRow['market'],
    _processed_action_id: processedActionRowId ?? null,
  })
  if (error) throw error
}

export async function finishGame(roomId: string, finalState: GameState, processedActionRowId?: string): Promise<void> {
  // final_results is host-computed (same trust level as the rest of the
  // authoritative state) so that submit_game_result never has to trust an
  // individual non-host player's self-reported win/net-worth claim.
  const { error } = await supabase.rpc('finish_game', {
    _room_id: roomId,
    _final_state: finalState as unknown as GameRow['state'],
    _final_results: buildFinalResults(finalState) as unknown as GameRow['final_results'],
    _processed_action_id: processedActionRowId ?? null,
  })
  if (error) throw error
}

export async function submitGameResult(roomId: string): Promise<void> {
  // Server reads the caller's own result from games.final_results (written
  // by finish_game) rather than accepting a client-supplied net worth/win
  // flag, and records it once per (room, profile) so repeat calls are no-ops.
  const { error } = await supabase.rpc('submit_game_result', { _room_id: roomId })
  if (error) throw error
}

export async function fetchGameByRoomId(roomId: string): Promise<GameRow | null> {
  const { data, error } = await supabase.from('games').select('*').eq('room_id', roomId).maybeSingle()
  if (error) throw error
  return data
}

export async function submitGameAction(gameId: string, profileId: string, action: GameAction): Promise<void> {
  const { error } = await supabase.from('game_actions').insert({
    game_id: gameId,
    profile_id: profileId,
    type: action.type,
    payload: action as unknown as GameActionRow['payload'],
  })
  if (error) throw error
}

export async function fetchUnprocessedActions(gameId: string): Promise<GameActionRow[]> {
  const { data, error } = await supabase
    .from('game_actions')
    .select('*')
    .eq('game_id', gameId)
    .eq('processed', false)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function markActionProcessed(actionId: string): Promise<void> {
  const { error } = await supabase.from('game_actions').update({ processed: true }).eq('id', actionId)
  if (error) throw error
}

export async function appendGameLog(gameId: string, seq: number, entry: GameState['log'][number]): Promise<void> {
  const { error } = await supabase.from('game_log').insert({
    game_id: gameId,
    seq,
    entry: entry as unknown as GameLogRow['entry'],
  })
  if (error) throw error
}
