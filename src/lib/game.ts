import { supabase } from './supabase'
import type { Tables } from '@/types/database.types'

export type Game = Tables<'games'>
export type GamePlayer = Tables<'game_players'>
export type GameResult = Tables<'game_results'>

const GAME_ERROR_MESSAGES: Record<string, string> = {
  not_host_or_not_in_lobby: 'The game has already started.',
  not_enough_players: 'You need at least 2 players to start.',
  players_not_ready: 'Everyone needs to be ready before starting.',
  not_authenticated: 'Your session expired — please refresh and try again.',
  game_not_found: 'This game no longer exists.',
  game_not_active: 'This game has already finished.',
  not_in_game: "You're not part of this game.",
  not_investment_phase: 'You can only do that during the Investment Phase.',
  card_not_in_hand: "That card isn't in your hand.",
  insufficient_funds: "You don't have enough cash for that.",
  asset_not_owned: "You don't own that asset.",
  debt_not_found: "That debt doesn't exist.",
  invalid_amount: 'Enter a valid amount.',
}

export function gameErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : ''
  return GAME_ERROR_MESSAGES[raw] ?? (raw || 'Something went wrong. Please try again.')
}

export async function startGame(roomId: string): Promise<Game> {
  const { data, error } = await supabase.rpc('game_start', { _room_id: roomId })
  if (error) throw error
  return data
}

export async function fetchGame(roomId: string): Promise<Game | null> {
  const { data, error } = await supabase.from('games').select('*').eq('room_id', roomId).maybeSingle()
  if (error) throw error
  return data
}

export async function fetchGamePlayers(gameId: string): Promise<GamePlayer[]> {
  const { data, error } = await supabase.from('game_players').select('*').eq('game_id', gameId).order('seat', { ascending: true })
  if (error) throw error
  return data
}

export async function setGameReady(gameId: string, ready: boolean): Promise<void> {
  const { error } = await supabase.rpc('game_set_ready', { _game_id: gameId, _ready: ready })
  if (error) throw error
}

export async function buyCard(gameId: string, cardId: string): Promise<void> {
  const { error } = await supabase.rpc('game_buy_card', { _game_id: gameId, _card_id: cardId })
  if (error) throw error
}

export async function sellAsset(gameId: string, instanceId: string): Promise<void> {
  const { error } = await supabase.rpc('game_sell_asset', { _game_id: gameId, _instance_id: instanceId })
  if (error) throw error
}

export async function borrow(gameId: string, amount: number): Promise<void> {
  const { error } = await supabase.rpc('game_borrow', { _game_id: gameId, _amount: amount })
  if (error) throw error
}

export async function repay(gameId: string, debtId: string, amount: number): Promise<void> {
  const { error } = await supabase.rpc('game_repay', { _game_id: gameId, _debt_id: debtId, _amount: amount })
  if (error) throw error
}

export async function fetchGameResults(roomId: string): Promise<GameResult[]> {
  const { data, error } = await supabase
    .from('game_results')
    .select('*')
    .eq('room_id', roomId)
    .order('net_worth', { ascending: false })
  if (error) throw error
  return data
}
