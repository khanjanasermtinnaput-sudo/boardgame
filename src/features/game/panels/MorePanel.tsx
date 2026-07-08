import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
import { INSURANCE_PREMIUM_PER_ROUND } from '@/engine/insurance'
import { EDUCATION_COST, EDUCATION_SALARY_BOOST } from '@/engine/education'
import { money } from '@/lib/format'
import type { GameAction } from '@/engine/actions'
import type { PlayerState } from '@/engine/types'

interface MorePanelProps {
  player: PlayerState
  disabled: boolean
  onDispatch: (action: GameAction) => void
}

export function MorePanel({ player, disabled, onDispatch }: MorePanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <GlassCard className="flex items-center gap-3 p-4">
        <span className="text-2xl">🛡️</span>
        <div className="flex-1">
          <p className="font-medium text-surface-50">Insurance</p>
          <p className="text-xs text-surface-400">
            {money(INSURANCE_PREMIUM_PER_ROUND)}/lap · covers 50% of negative event losses
          </p>
        </div>
        {player.insured ? (
          <Button size="sm" variant="ghost" disabled={disabled} onClick={() => onDispatch({ type: 'CANCEL_INSURANCE' })}>
            Cancel
          </Button>
        ) : (
          <Button size="sm" variant="secondary" disabled={disabled} onClick={() => onDispatch({ type: 'BUY_INSURANCE' })}>
            Buy
          </Button>
        )}
      </GlassCard>

      <GlassCard className="flex items-center gap-3 p-4">
        <span className="text-2xl">🎓</span>
        <div className="flex-1">
          <p className="font-medium text-surface-50">Education</p>
          <p className="text-xs text-surface-400">
            One-time {money(EDUCATION_COST)} · +{money(EDUCATION_SALARY_BOOST)}/lap salary, permanently
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          disabled={disabled || player.educated || player.cash < EDUCATION_COST}
          onClick={() => onDispatch({ type: 'BUY_EDUCATION' })}
        >
          {player.educated ? 'Done' : 'Enroll'}
        </Button>
      </GlassCard>
    </div>
  )
}
