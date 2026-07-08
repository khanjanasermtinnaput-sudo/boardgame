import { PROPERTIES, PROPERTIES_BY_ID } from '@/content/properties'
import { Button } from '@/components/ui/Button'
import { propertyCurrentValue } from '@/engine/economy'
import { money } from '@/lib/format'
import type { GameAction } from '@/engine/actions'
import type { MarketState, PlayerState } from '@/engine/types'

interface PropertyPanelProps {
  player: PlayerState
  market: MarketState
  round: number
  disabled: boolean
  onDispatch: (action: GameAction) => void
}

export function PropertyPanel({ player, market, round, disabled, onDispatch }: PropertyPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {PROPERTIES.map((prop) => (
          <div key={prop.id} className="flex items-center gap-2 rounded-xl bg-white/[0.04] p-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-surface-50">{prop.name}</p>
              <p className="text-xs text-surface-400">
                Rent {money(prop.baseRentalIncome)}/lap · Maint. {money(prop.maintenance)}
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              disabled={disabled || prop.purchasePrice > player.cash}
              onClick={() => onDispatch({ type: 'BUY_PROPERTY', templateId: prop.id })}
            >
              Buy {money(prop.purchasePrice)}
            </Button>
          </div>
        ))}
      </div>

      {player.properties.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase text-surface-400">Your Properties</p>
          <div className="flex flex-col gap-2">
            {player.properties.map((owned) => {
              const template = PROPERTIES_BY_ID.get(owned.templateId)
              const value = propertyCurrentValue(owned.templateId, owned.purchaseRound, market, round)
              return (
                <div key={owned.id} className="flex items-center gap-2 rounded-xl bg-white/[0.04] p-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-surface-50">{template?.name}</p>
                    <p className="text-xs text-surface-400">Est. value {money(value)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={disabled}
                    onClick={() => onDispatch({ type: 'SELL_PROPERTY', ownedId: owned.id })}
                  >
                    Sell
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
