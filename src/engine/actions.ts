export type GameAction =
  | { type: 'ROLL_DICE' }
  | { type: 'ACK_EVENT_CARD' }
  | { type: 'BUY_INVESTMENT'; instrumentId: string; quantity: number }
  | { type: 'SELL_INVESTMENT'; instrumentId: string; quantity: number }
  | { type: 'BUY_BUSINESS'; templateId: string }
  | { type: 'UPGRADE_BUSINESS'; templateId: string }
  | { type: 'SELL_BUSINESS'; templateId: string }
  | { type: 'BUY_PROPERTY'; templateId: string }
  | { type: 'SELL_PROPERTY'; ownedId: string }
  | { type: 'TAKE_LOAN'; amount: number }
  | { type: 'REPAY_LOAN'; loanId: string; amount: number }
  | { type: 'BUY_INSURANCE' }
  | { type: 'CANCEL_INSURANCE' }
  | { type: 'BUY_EDUCATION' }
  | { type: 'BUY_AUCTION_ITEM' }
  | { type: 'END_TURN' }

type FieldSpec = Record<string, 'string' | 'number'>

// Field shape for every GameAction variant beyond its `type` tag. Used by
// isGameAction below to reject malformed/tampered payloads (e.g. a queued
// game_actions row with the wrong field types or extra/missing fields)
// before they ever reach the reducer — RLS only checks who inserted the
// row, not that its `payload` matches the shape its `type` claims.
const ACTION_FIELD_SPECS: Record<GameAction['type'], FieldSpec> = {
  ROLL_DICE: {},
  ACK_EVENT_CARD: {},
  BUY_INVESTMENT: { instrumentId: 'string', quantity: 'number' },
  SELL_INVESTMENT: { instrumentId: 'string', quantity: 'number' },
  BUY_BUSINESS: { templateId: 'string' },
  UPGRADE_BUSINESS: { templateId: 'string' },
  SELL_BUSINESS: { templateId: 'string' },
  BUY_PROPERTY: { templateId: 'string' },
  SELL_PROPERTY: { ownedId: 'string' },
  TAKE_LOAN: { amount: 'number' },
  REPAY_LOAN: { loanId: 'string', amount: 'number' },
  BUY_INSURANCE: {},
  CANCEL_INSURANCE: {},
  BUY_EDUCATION: {},
  BUY_AUCTION_ITEM: {},
  END_TURN: {},
}

export function isGameAction(value: unknown): value is GameAction {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  if (typeof record.type !== 'string') return false

  const spec = ACTION_FIELD_SPECS[record.type as GameAction['type']]
  if (!spec) return false

  const expectedKeys = Object.keys(spec)
  const actualKeys = Object.keys(record).filter((k) => k !== 'type')
  if (actualKeys.length !== expectedKeys.length) return false

  for (const [key, kind] of Object.entries(spec)) {
    const fieldValue = record[key]
    if (kind === 'number') {
      if (typeof fieldValue !== 'number' || !Number.isFinite(fieldValue)) return false
    } else if (typeof fieldValue !== 'string' || fieldValue.length === 0) {
      return false
    }
  }

  return true
}
