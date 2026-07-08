import { useState } from 'react'
import { INVESTMENTS } from '@/content/investments'
import { Button } from '@/components/ui/Button'
import type { GameAction } from '@/engine/actions'
import type { MarketState, PlayerState } from '@/engine/types'

interface InvestmentPanelProps {
  player: PlayerState
  market: MarketState
  disabled: boolean
  onDispatch: (action: GameAction) => void
}

export function InvestmentPanel({ player, market, disabled, onDispatch }: InvestmentPanelProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  return (
    <div className="flex flex-col gap-2">
      {INVESTMENTS.map((inv) => {
        const price = market.prices[inv.id] ?? inv.basePrice
        const owned = player.investments.find((o) => o.instrumentId === inv.id)
        const qty = quantities[inv.id] ?? 1

        return (
          <div key={inv.id} className="flex items-center gap-2 rounded-xl bg-white/[0.04] p-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-surface-50">
                {inv.name} <span className="text-surface-500">{inv.ticker}</span>
              </p>
              <p className="text-xs text-surface-400">
                ${price.toFixed(2)} · {inv.category} · risk {Math.round(inv.risk * 100)}%
                {owned && <span className="ml-1 text-surface-300">· own {owned.quantity}</span>}
              </p>
            </div>
            <input
              type="number"
              min={1}
              value={qty}
              disabled={disabled}
              onChange={(e) => setQuantities((q) => ({ ...q, [inv.id]: Math.max(1, Number(e.target.value)) }))}
              className="h-8 w-16 rounded-lg border border-white/10 bg-white/[0.05] px-2 text-center text-xs text-surface-50"
            />
            <Button
              size="sm"
              variant="secondary"
              disabled={disabled || price * qty > player.cash}
              onClick={() => onDispatch({ type: 'BUY_INVESTMENT', instrumentId: inv.id, quantity: qty })}
            >
              Buy
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={disabled || !owned || owned.quantity < qty}
              onClick={() => onDispatch({ type: 'SELL_INVESTMENT', instrumentId: inv.id, quantity: qty })}
            >
              Sell
            </Button>
          </div>
        )
      })}
    </div>
  )
}
