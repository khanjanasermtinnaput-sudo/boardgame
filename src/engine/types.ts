// Net Worth — core engine types. Pure data, no React/Supabase dependency.

export type SpaceType =
  | 'payday'
  | 'investment'
  | 'business'
  | 'real_estate'
  | 'market'
  | 'tax'
  | 'salary'
  | 'event'
  | 'loan'
  | 'auction'
  | 'insurance'
  | 'education'
  | 'economic_crisis'
  | 'bonus'
  | 'charity'
  | 'vacation'
  | 'random'

export interface BoardSpace {
  id: number
  type: SpaceType
  name: string
  description: string
}

export type InvestmentCategory = 'growth' | 'dividend' | 'value' | 'high_risk'
export type AssetClass = 'stock' | 'bond'

export interface InvestmentInstrument {
  id: string
  name: string
  ticker: string
  assetClass: AssetClass
  category: InvestmentCategory
  basePrice: number
  risk: number
  baseReturn: number
  dividendYield: number
  volatility: number
  description: string
}

export interface BusinessTemplate {
  id: string
  name: string
  purchasePrice: number
  baseIncome: number
  maintenance: number
  upgradeCost: number
  upgradeIncomeBoost: number
  maxLevel: number
  description: string
}

export interface PropertyTemplate {
  id: string
  name: string
  category: string
  purchasePrice: number
  baseRentalIncome: number
  maintenance: number
  appreciationRate: number
  description: string
}

export type EventCategory =
  | 'positive'
  | 'negative'
  | 'neutral'
  | 'economic'
  | 'business'
  | 'family'
  | 'health'
  | 'investment'
  | 'tax'

export type EventEffectKind =
  | 'cash_delta'
  | 'cash_percent_of_net_worth'
  | 'cash_percent_of_cash'
  | 'income_delta'
  | 'expense_delta'
  | 'liability_delta'
  | 'force_sell_random_asset'
  | 'skip_next_turn'
  | 'move_spaces'
  | 'market_shift'
  | 'lose_random_investment_percent'

export interface EventEffect {
  kind: EventEffectKind
  amount?: number
  percent?: number
  regime?: MarketRegimeType
  spaces?: number
}

export interface EventCard {
  id: string
  category: EventCategory
  title: string
  flavor: string
  effects: EventEffect[]
}

export type MarketRegimeType =
  | 'bull'
  | 'bear'
  | 'inflation'
  | 'recession'
  | 'interest_rate'
  | 'tech_boom'
  | 'energy_crisis'
  | 'crash'

export interface MarketRegimeDef {
  type: MarketRegimeType
  name: string
  description: string
  categoryMultipliers: Record<InvestmentCategory, number>
  propertyMultiplier: number
  businessIncomeMultiplier: number
  interestRateDelta: number
}

export interface MarketState {
  regime: MarketRegimeType
  roundsRemaining: number
  interestRate: number
  prices: Record<string, number>
  propertyIndex: number
}

export interface OwnedInvestment {
  instrumentId: string
  quantity: number
  avgBuyPrice: number
}

export interface OwnedBusiness {
  templateId: string
  level: number
  purchasePrice: number
}

export interface OwnedProperty {
  id: string
  templateId: string
  purchasePrice: number
  purchaseRound: number
}

export interface Loan {
  id: string
  principal: number
  balance: number
  interestRate: number
}

export interface PlayerState {
  id: string
  name: string
  tokenColor: string
  seat: number
  position: number
  cash: number
  salary: number
  baseExpenses: number
  investments: OwnedInvestment[]
  businesses: OwnedBusiness[]
  properties: OwnedProperty[]
  loans: Loan[]
  insured: boolean
  educated: boolean
  skipTurns: number
  bankrupt: boolean
}

export type AuctionKind = 'investment' | 'business' | 'property'

export interface AuctionOffer {
  kind: AuctionKind
  id: string
  price: number
}

export type WinCondition =
  | { type: 'target'; targetNetWorth: number }
  | { type: 'rounds'; totalRounds: number }
  | { type: 'survival' }

export interface LogEntry {
  seq: number
  message: string
  timestamp: number
}

export type GamePhase = 'rolling' | 'resolving' | 'action' | 'ended'

export type ActionResult<T> = { ok: true; value: T } | { ok: false; error: string }

export interface GameState {
  players: PlayerState[]
  turnNumber: number
  round: number
  turnIndex: number
  market: MarketState
  log: LogEntry[]
  winCondition: WinCondition
  phase: GamePhase
  lastRoll?: [number, number]
  doublesStreak: number
  pendingEventCardId?: string
  pendingAuction?: AuctionOffer
  winnerId?: string
}
