// Mirrors supabase/migrations/0010_seed_global_events.sql — for display
// only. The actual roll and market mutation happen server-side in
// private.resolve_phase_1_to_2; this file lets the client show event
// flavor text without an extra round trip when useful.
import type { CardCategory } from './cards'

export type GlobalEventType = 'positive_market' | 'economic_slowdown' | 'black_event'

export interface GlobalEventTemplate {
  id: string
  name: string
  type: GlobalEventType
  description: string
  effects: Partial<Record<CardCategory, number>>
}

export const GLOBAL_EVENT_WEIGHTS: Record<GlobalEventType, number> = {
  positive_market: 0.5,
  economic_slowdown: 0.3,
  black_event: 0.2,
}

export const GLOBAL_EVENT_CATALOG: GlobalEventTemplate[] = [
  { id: 'pos_1', name: 'Bull Run Rally', type: 'positive_market', description: 'Investor confidence surges across the stock market.', effects: { growth_stock: 1.15, dividend_stock: 1.10 } },
  { id: 'pos_2', name: 'Housing Boom', type: 'positive_market', description: 'A wave of buyers pushes property prices sharply higher.', effects: { house: 1.12, commercial_building: 1.10, land: 1.08 } },
  { id: 'pos_3', name: 'Crypto Surge', type: 'positive_market', description: 'A wave of new adoption sends digital tokens soaring.', effects: { crypto: 1.30 } },
  { id: 'pos_4', name: 'Gold Rush Discovery', type: 'positive_market', description: 'News of a major gold discovery lifts bullion prices.', effects: { gold: 1.20 } },
  { id: 'pos_5', name: 'Business Expansion Wave', type: 'positive_market', description: 'Consumer spending climbs and small businesses thrive.', effects: { business: 1.15, commercial_building: 1.08 } },
  { id: 'pos_6', name: 'Tech Breakthrough', type: 'positive_market', description: 'A major technology breakthrough excites growth investors.', effects: { growth_stock: 1.20 } },
  { id: 'pos_7', name: 'Auto Market Boom', type: 'positive_market', description: 'Strong demand pushes vehicle values up.', effects: { car: 1.10 } },
  { id: 'pos_8', name: 'Land Development Boom', type: 'positive_market', description: 'New infrastructure plans drive land prices upward.', effects: { land: 1.18, commercial_building: 1.10 } },
  { id: 'pos_9', name: 'Broad Economic Growth', type: 'positive_market', description: 'A strong quarter of economic growth lifts nearly every asset class.', effects: { house: 1.05, business: 1.05, growth_stock: 1.05, dividend_stock: 1.05, gold: 1.05, car: 1.05, land: 1.05, commercial_building: 1.05, crypto: 1.05, special_asset: 1.05 } },
  { id: 'slow_1', name: 'Consumer Spending Dip', type: 'economic_slowdown', description: 'Shoppers pull back, hurting small businesses and car sales.', effects: { business: 0.90, car: 0.92 } },
  { id: 'slow_2', name: 'Housing Market Cooling', type: 'economic_slowdown', description: 'Rising rates cool buyer demand for property.', effects: { house: 0.92, land: 0.94 } },
  { id: 'slow_3', name: 'Stock Market Correction', type: 'economic_slowdown', description: 'A broad pullback hits growth names hardest.', effects: { growth_stock: 0.88, dividend_stock: 0.94 } },
  { id: 'slow_4', name: 'Crypto Winter', type: 'economic_slowdown', description: 'Digital token prices slide as trading volume dries up.', effects: { crypto: 0.80 } },
  { id: 'slow_5', name: 'Commercial Vacancy Rise', type: 'economic_slowdown', description: 'Rising office vacancies weigh on commercial property values.', effects: { commercial_building: 0.90 } },
  { id: 'slow_6', name: 'Mild Recession Signals', type: 'economic_slowdown', description: 'Soft economic data weighs on asset prices broadly.', effects: { house: 0.95, business: 0.95, growth_stock: 0.95, dividend_stock: 0.95, gold: 0.95, car: 0.95, land: 0.95, commercial_building: 0.95, crypto: 0.95, special_asset: 0.95 } },
  { id: 'black_1', name: 'Market Crash', type: 'black_event', description: 'A sudden, severe crash wipes out value across nearly every asset class.', effects: { growth_stock: 0.65, dividend_stock: 0.80, business: 0.75, commercial_building: 0.80, house: 0.85, land: 0.90, car: 0.85, crypto: 0.55, gold: 1.25 } },
  { id: 'black_2', name: 'Financial Crisis', type: 'black_event', description: 'A systemic financial crisis batters markets while investors flee to gold.', effects: { house: 0.80, business: 0.80, growth_stock: 0.80, dividend_stock: 0.80, land: 0.80, commercial_building: 0.80, car: 0.80, crypto: 0.80, special_asset: 0.80, gold: 1.30 } },
  { id: 'black_3', name: 'Crypto Collapse', type: 'black_event', description: 'A major exchange failure triggers a collapse in digital token prices.', effects: { crypto: 0.40, gold: 1.15 } },
]
