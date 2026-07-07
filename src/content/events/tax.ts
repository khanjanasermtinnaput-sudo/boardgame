import type { EventCard } from '@/engine/types'

export const TAX_EVENTS: EventCard[] = [
  { id: 'tax-001', category: 'tax', title: 'Annual Tax Bill', flavor: 'It is that time of year — your tax bill comes due.', effects: [{ kind: 'cash_percent_of_net_worth', percent: -0.04 }] },
  { id: 'tax-002', category: 'tax', title: 'Tax Refund', flavor: 'You overpaid last year, and a refund lands in your account.', effects: [{ kind: 'cash_delta', amount: 500 }] },
  { id: 'tax-003', category: 'tax', title: 'Audit Notice', flavor: 'A routine audit turns up a few discrepancies.', effects: [{ kind: 'cash_delta', amount: -600 }] },
  { id: 'tax-004', category: 'tax', title: 'New Deduction Found', flavor: 'Your accountant finds a deduction you had been missing.', effects: [{ kind: 'cash_delta', amount: 350 }] },
  { id: 'tax-005', category: 'tax', title: 'Property Tax Reassessment', flavor: 'A reassessment raises your property tax bill.', effects: [{ kind: 'expense_delta', amount: 70 }] },
  { id: 'tax-006', category: 'tax', title: 'Capital Gains Due', flavor: 'A profitable year means a bigger capital gains bill.', effects: [{ kind: 'cash_percent_of_net_worth', percent: -0.03 }] },
  { id: 'tax-007', category: 'tax', title: 'Tax Credit Applied', flavor: 'You qualify for a credit you did not know existed.', effects: [{ kind: 'cash_delta', amount: 300 }] },
  { id: 'tax-008', category: 'tax', title: 'Filing Extension Fee', flavor: 'You file for an extension and pay a small fee for the privilege.', effects: [{ kind: 'cash_delta', amount: -80 }] },
  { id: 'tax-009', category: 'tax', title: 'Business Expense Write-Off', flavor: 'A round of business write-offs trims your tax burden.', effects: [{ kind: 'cash_delta', amount: 250 }] },
  { id: 'tax-010', category: 'tax', title: 'Penalty for Late Filing', flavor: 'A late filing triggers a penalty from the tax office.', effects: [{ kind: 'cash_delta', amount: -220 }] },
  { id: 'tax-011', category: 'tax', title: 'Tax Law Simplified', flavor: 'A change in tax law simplifies your filing and lowers your bill.', effects: [{ kind: 'expense_delta', amount: -30 }] },
  { id: 'tax-012', category: 'tax', title: 'Municipal Tax Hike', flavor: 'The city raises local taxes to fund new infrastructure.', effects: [{ kind: 'expense_delta', amount: 55 }] },
  { id: 'tax-013', category: 'tax', title: 'Charitable Deduction', flavor: 'Your charitable giving pays off at tax time.', effects: [{ kind: 'cash_delta', amount: 200 }] },
  { id: 'tax-014', category: 'tax', title: 'Back Taxes Owed', flavor: 'An old filing error surfaces, and back taxes come due.', effects: [{ kind: 'cash_delta', amount: -500 }] },
  { id: 'tax-015', category: 'tax', title: 'Tax-Advantaged Account Opened', flavor: 'You open a tax-advantaged account, trimming next year’s bill.', effects: [{ kind: 'expense_delta', amount: -35 }] },
  { id: 'tax-016', category: 'tax', title: 'Windfall Tax', flavor: 'A one-time windfall tax applies to a recent gain.', effects: [{ kind: 'cash_percent_of_net_worth', percent: -0.025 }] },
  { id: 'tax-017', category: 'tax', title: 'Amended Return Approved', flavor: 'An amended return is approved, releasing funds you were owed.', effects: [{ kind: 'cash_delta', amount: 400 }] },
  { id: 'tax-018', category: 'tax', title: 'Estimated Payment Due', flavor: 'Quarterly estimated taxes come due right on schedule.', effects: [{ kind: 'cash_delta', amount: -300 }] },
  { id: 'tax-019', category: 'tax', title: 'Tax Software Glitch', flavor: 'A software glitch delays your refund by a few weeks — but it clears.', effects: [{ kind: 'cash_delta', amount: 180 }] },
  { id: 'tax-020', category: 'tax', title: 'Depreciation Benefit', flavor: 'Depreciation on your assets lowers this year’s taxable income.', effects: [{ kind: 'cash_delta', amount: 260 }] },
]
