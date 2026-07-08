import { BUSINESSES } from '@/content/businesses'
import { Button } from '@/components/ui/Button'
import { businessCurrentValue } from '@/engine/economy'
import { money } from '@/lib/format'
import type { GameAction } from '@/engine/actions'
import type { PlayerState } from '@/engine/types'

interface BusinessPanelProps {
  player: PlayerState
  disabled: boolean
  onDispatch: (action: GameAction) => void
}

export function BusinessPanel({ player, disabled, onDispatch }: BusinessPanelProps) {
  return (
    <div className="flex flex-col gap-2">
      {BUSINESSES.map((biz) => {
        const owned = player.businesses.find((o) => o.templateId === biz.id)
        const currentValue = owned ? businessCurrentValue(biz.id, owned.level) : biz.purchasePrice
        const income = owned ? biz.baseIncome + (owned.level - 1) * biz.upgradeIncomeBoost : biz.baseIncome

        return (
          <div key={biz.id} className="flex items-center gap-2 rounded-xl bg-white/[0.04] p-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-surface-50">
                {biz.name} {owned && <span className="text-xs text-surface-400">Lv.{owned.level}</span>}
              </p>
              <p className="text-xs text-surface-400">
                Income {money(income)}/lap · Maint. {money(biz.maintenance * (owned?.level ?? 1))}
              </p>
            </div>
            {!owned ? (
              <Button
                size="sm"
                variant="secondary"
                disabled={disabled || biz.purchasePrice > player.cash}
                onClick={() => onDispatch({ type: 'BUY_BUSINESS', templateId: biz.id })}
              >
                Buy {money(biz.purchasePrice)}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={disabled || owned.level >= biz.maxLevel || biz.upgradeCost > player.cash}
                  onClick={() => onDispatch({ type: 'UPGRADE_BUSINESS', templateId: biz.id })}
                >
                  Upgrade {money(biz.upgradeCost)}
                </Button>
                <Button size="sm" variant="ghost" disabled={disabled} onClick={() => onDispatch({ type: 'SELL_BUSINESS', templateId: biz.id })}>
                  Sell {money(currentValue * 0.85)}
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
