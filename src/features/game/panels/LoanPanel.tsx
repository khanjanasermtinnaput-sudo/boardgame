import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/TextInput'
import { money } from '@/lib/format'
import type { GameAction } from '@/engine/actions'
import type { PlayerState } from '@/engine/types'

interface LoanPanelProps {
  player: PlayerState
  disabled: boolean
  onDispatch: (action: GameAction) => void
}

export function LoanPanel({ player, disabled, onDispatch }: LoanPanelProps) {
  const [amount, setAmount] = useState(1000)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-2">
        <TextInput label="Take a Loan" type="number" min={100} step={100} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        <Button disabled={disabled || amount <= 0} onClick={() => onDispatch({ type: 'TAKE_LOAN', amount })}>
          Borrow
        </Button>
      </div>

      {player.loans.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase text-surface-400">Your Loans</p>
          {player.loans.map((loan) => (
            <div key={loan.id} className="flex items-center gap-2 rounded-xl bg-white/[0.04] p-3 text-sm">
              <div className="flex-1">
                <p className="text-surface-50">Balance {money(loan.balance)}</p>
                <p className="text-xs text-surface-400">Rate {(loan.interestRate * 100).toFixed(1)}% / lap</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={disabled || player.cash <= 0}
                onClick={() => onDispatch({ type: 'REPAY_LOAN', loanId: loan.id, amount: Math.min(loan.balance, player.cash) })}
              >
                Repay
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
