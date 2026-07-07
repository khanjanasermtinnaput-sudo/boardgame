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
