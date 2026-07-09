// Mirrors the jsonb shapes stored in game_players / games. This is the
// client's view of server-authoritative state — nothing here is ever
// computed client-side and trusted; it's for typing realtime payloads and
// driving pure display/prediction helpers in netWorth.ts.
import type { CardCategory } from '@/content/cards'

export type GamePhase = 1 | 2 | 3 | 4 | 5
export type GameStatus = 'active' | 'finished'

export interface HandCard {
  card_id: string
  name: string
  category: CardCategory
  purchase_price: number
  base_value: number
  passive_income: number
  description: string
}

export interface AssetInstance {
  instance_id: string
  card_id: string
  name: string
  category: CardCategory
  base_value: number
  passive_income: number
  bought_at_price: number
  acquired_age: number
}

export interface DebtCard {
  debt_id: string
  principal: number
  outstanding: number
  created_age: number
}

export interface GlobalEventState {
  id: string
  name: string
  type: 'positive_market' | 'economic_slowdown' | 'black_event'
  description: string
  effects: Partial<Record<CardCategory, number>>
}

export interface PersonalEventState {
  id: string
  name: string
  description: string
  effect_kind: 'cash' | 'cash_pct_net_worth' | 'salary' | 'grant_card'
  amount: number | null
  pct: number | null
}

export interface IncomeSummary {
  salary: number
  passive_income: number
  gross_income: number
  living_cost: number
  maintenance: number
  tax: number
  net_change: number
  debt_count: number
  interest_rate: number
  interest_total: number
}

export type MarketMultipliers = Partial<Record<CardCategory, number>>

export interface RollState {
  die1: number
  die2: number
  total: number
  tile_index: number
}

export interface GameRow {
  id: string
  room_id: string
  status: GameStatus
  age: number
  phase: GamePhase
  round_no: number
  paused: boolean
  market: MarketMultipliers
  global_event: GlobalEventState | Record<string, never>
  last_roll: RollState | Record<string, never>
  updated_at: string
}

export interface GamePlayerRow {
  game_id: string
  profile_id: string
  seat: number
  cash: number
  salary: number
  hand: HandCard[]
  assets: AssetInstance[]
  debts: DebtCard[]
  passive_income: number
  net_worth: number
  ready: boolean
  personal_event: PersonalEventState | Record<string, never>
  income_summary: IncomeSummary | Record<string, never>
  updated_at: string
}
