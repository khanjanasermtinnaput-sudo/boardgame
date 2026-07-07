import type { ActionResult, PlayerState } from './types'

export const MAX_LOAN_TO_CASH_RATIO = 3
export const LOAN_BASE_INTEREST_RATE = 0.08

export function takeLoan(player: PlayerState, amount: number, marketInterestRate: number): ActionResult<PlayerState> {
  if (amount <= 0 || !Number.isFinite(amount)) return { ok: false, error: 'invalid_amount' }

  const existingDebt = player.loans.reduce((sum, l) => sum + l.balance, 0)
  const creditLimit = Math.max(5000, (player.cash + existingDebt) * MAX_LOAN_TO_CASH_RATIO)
  if (existingDebt + amount > creditLimit) return { ok: false, error: 'credit_limit_exceeded' }

  const interestRate = LOAN_BASE_INTEREST_RATE + marketInterestRate
  const loan = { id: crypto.randomUUID(), principal: amount, balance: amount, interestRate }

  return { ok: true, value: { ...player, cash: player.cash + amount, loans: [...player.loans, loan] } }
}

export function repayLoan(player: PlayerState, loanId: string, amount: number): ActionResult<PlayerState> {
  const loan = player.loans.find((l) => l.id === loanId)
  if (!loan) return { ok: false, error: 'unknown_loan' }
  if (amount <= 0 || !Number.isFinite(amount)) return { ok: false, error: 'invalid_amount' }
  if (amount > player.cash) return { ok: false, error: 'insufficient_cash' }

  const payment = Math.min(amount, loan.balance)
  const remaining = loan.balance - payment
  const loans = remaining > 0
    ? player.loans.map((l) => (l.id === loanId ? { ...l, balance: remaining } : l))
    : player.loans.filter((l) => l.id !== loanId)

  return { ok: true, value: { ...player, cash: player.cash - payment, loans } }
}
