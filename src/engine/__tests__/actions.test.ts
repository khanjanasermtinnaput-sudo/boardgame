import { describe, it, expect } from 'vitest'
import { isGameAction } from '../actions'

describe('isGameAction (F7 — queued action payload validation)', () => {
  it('accepts every well-formed action variant', () => {
    const valid = [
      { type: 'ROLL_DICE' },
      { type: 'ACK_EVENT_CARD' },
      { type: 'BUY_INVESTMENT', instrumentId: 'nova-robotics', quantity: 5 },
      { type: 'SELL_INVESTMENT', instrumentId: 'nova-robotics', quantity: 5 },
      { type: 'BUY_BUSINESS', templateId: 'coffee-shop' },
      { type: 'UPGRADE_BUSINESS', templateId: 'coffee-shop' },
      { type: 'SELL_BUSINESS', templateId: 'coffee-shop' },
      { type: 'BUY_PROPERTY', templateId: 'downtown-condo' },
      { type: 'SELL_PROPERTY', ownedId: 'owned-1' },
      { type: 'TAKE_LOAN', amount: 1000 },
      { type: 'REPAY_LOAN', loanId: 'loan-1', amount: 500 },
      { type: 'BUY_INSURANCE' },
      { type: 'CANCEL_INSURANCE' },
      { type: 'BUY_EDUCATION' },
      { type: 'BUY_AUCTION_ITEM' },
      { type: 'END_TURN' },
    ]
    for (const action of valid) expect(isGameAction(action)).toBe(true)
  })

  it('rejects a queued row with a numeric field sent as a string', () => {
    expect(isGameAction({ type: 'TAKE_LOAN', amount: '1000' })).toBe(false)
  })

  it('rejects extra/injected fields beyond the declared shape', () => {
    expect(isGameAction({ type: 'END_TURN', extra: 'field' })).toBe(false)
    expect(isGameAction({ type: 'BUY_BUSINESS', templateId: 'coffee-shop', quantity: 999 })).toBe(false)
  })

  it('rejects missing required fields', () => {
    expect(isGameAction({ type: 'BUY_BUSINESS' })).toBe(false)
    expect(isGameAction({ type: 'REPAY_LOAN', loanId: 'loan-1' })).toBe(false)
  })

  it('rejects non-finite numbers (Infinity/NaN injected via JSON-adjacent payloads)', () => {
    expect(isGameAction({ type: 'TAKE_LOAN', amount: Number.POSITIVE_INFINITY })).toBe(false)
    expect(isGameAction({ type: 'TAKE_LOAN', amount: Number.NaN })).toBe(false)
  })

  it('rejects an unknown action type', () => {
    expect(isGameAction({ type: 'DELETE_ALL_PLAYERS' })).toBe(false)
  })

  it('rejects non-object payloads', () => {
    expect(isGameAction(null)).toBe(false)
    expect(isGameAction('END_TURN')).toBe(false)
    expect(isGameAction(42)).toBe(false)
    expect(isGameAction(undefined)).toBe(false)
  })
})
