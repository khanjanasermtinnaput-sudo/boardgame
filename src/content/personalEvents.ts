// Mirrors supabase/migrations/0011_seed_personal_events.sql — for display
// only. The actual draw and effect application happen server-side in
// private.resolve_phase_2_to_3.

export type PersonalEventEffectKind = 'cash' | 'cash_pct_net_worth' | 'salary' | 'grant_card'

export interface PersonalEventTemplate {
  id: string
  name: string
  description: string
  effectKind: PersonalEventEffectKind
  amount: number | null
  pct: number | null
}

export const PERSONAL_EVENT_CATALOG: PersonalEventTemplate[] = [
  { id: 'pe_1', name: 'Signing Bonus', description: 'Your employer pays out a one-time signing bonus.', effectKind: 'cash', amount: 1500, pct: null },
  { id: 'pe_2', name: 'Medical Expense', description: 'An unexpected medical bill arrives.', effectKind: 'cash', amount: -2000, pct: null },
  { id: 'pe_3', name: 'Inheritance Windfall', description: 'A distant relative leaves you an inheritance.', effectKind: 'cash_pct_net_worth', amount: null, pct: 0.05 },
  { id: 'pe_4', name: 'Vehicle Repair Bill', description: 'Your vehicle needs urgent repairs.', effectKind: 'cash', amount: -800, pct: null },
  { id: 'pe_5', name: 'Investment Opportunity', description: 'A once-in-a-lifetime deal lands in your lap — you acquire an asset for free.', effectKind: 'grant_card', amount: null, pct: null },
  { id: 'pe_6', name: 'Promotion at Work', description: 'You are promoted, permanently raising your salary.', effectKind: 'salary', amount: 300, pct: null },
  { id: 'pe_7', name: 'Tax Refund', description: 'A tax refund arrives in your account.', effectKind: 'cash', amount: 600, pct: null },
  { id: 'pe_8', name: 'Legal Settlement', description: 'You win a legal settlement.', effectKind: 'cash', amount: 2500, pct: null },
  { id: 'pe_9', name: 'Home Repair Cost', description: 'A home repair costs more than expected.', effectKind: 'cash', amount: -1200, pct: null },
  { id: 'pe_10', name: 'Wedding Gift', description: 'You receive a generous cash gift.', effectKind: 'cash', amount: 1000, pct: null },
  { id: 'pe_11', name: 'Identity Theft', description: 'You lose money resolving a case of identity theft.', effectKind: 'cash', amount: -1500, pct: null },
  { id: 'pe_12', name: 'Side Hustle Income', description: 'A side project pays off nicely this round.', effectKind: 'cash', amount: 700, pct: null },
  { id: 'pe_13', name: 'Stock Tip Payoff', description: 'A well-timed tip nets you an unexpected gain.', effectKind: 'cash_pct_net_worth', amount: null, pct: 0.03 },
  { id: 'pe_14', name: 'Emergency Fund Depletion', description: 'An emergency drains part of your savings.', effectKind: 'cash_pct_net_worth', amount: null, pct: -0.04 },
  { id: 'pe_15', name: 'Lawsuit Payout', description: 'You are ordered to pay damages in a lawsuit.', effectKind: 'cash', amount: -3000, pct: null },
  { id: 'pe_16', name: 'Lottery Ticket Win', description: 'A lucky ticket pays off.', effectKind: 'cash', amount: 2000, pct: null },
  { id: 'pe_17', name: 'Freelance Contract', description: 'A short freelance contract brings in extra cash.', effectKind: 'cash', amount: 900, pct: null },
  { id: 'pe_18', name: 'Pet Emergency Vet Bill', description: 'Your pet needs emergency veterinary care.', effectKind: 'cash', amount: -600, pct: null },
  { id: 'pe_19', name: 'Family Support Request', description: 'A family member asks for financial help.', effectKind: 'cash', amount: -1000, pct: null },
  { id: 'pe_20', name: 'Bonus Dividend Payout', description: 'One of your holdings issues a surprise bonus payout.', effectKind: 'cash', amount: 1100, pct: null },
  { id: 'pe_21', name: 'Car Accident (Uninsured)', description: 'An accident leaves you covering repair costs out of pocket.', effectKind: 'cash', amount: -1800, pct: null },
  { id: 'pe_22', name: 'Scholarship Award', description: 'You receive a scholarship award.', effectKind: 'cash', amount: 1300, pct: null },
  { id: 'pe_23', name: 'Job Loss Setback', description: 'A layoff temporarily reduces your income.', effectKind: 'salary', amount: -200, pct: null },
  { id: 'pe_24', name: 'Charity Windfall Received', description: 'A local charity distributes an unexpected windfall.', effectKind: 'cash', amount: 500, pct: null },
]
