import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { money } from '@/lib/format'
import { gameErrorMessage, buyCard } from '@/lib/game'
import { buyPrice } from '@/engine/netWorth'
import { CATEGORY_ICONS } from '@/content/cards'
import type { HandCard, MarketMultipliers } from '@/engine/types'

interface HandGridProps {
  gameId: string
  hand: HandCard[]
  market: MarketMultipliers
  cash: number
  /** Buying is only allowed during the Invest / Buy phase; otherwise tiles are read-only. */
  buyable: boolean
}

/** Square icon-tile hand display, 4 cards per row, replacing the old wide description-card layout. */
export function HandGrid({ gameId, hand, market, cash, buyable }: HandGridProps) {
  const [error, setError] = useState<string | null>(null)
  const [busyCardId, setBusyCardId] = useState<string | null>(null)

  async function handleBuy(cardId: string) {
    setBusyCardId(cardId)
    setError(null)
    try {
      await buyCard(gameId, cardId)
    } catch (err) {
      setError(gameErrorMessage(err))
    } finally {
      setBusyCardId(null)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-[color:var(--color-red)]">{error}</p>}
      <div className="grid grid-cols-4 gap-2">
        {hand.map((card) => {
          const price = buyPrice(card.purchase_price, market, card.category)
          const affordable = cash >= price
          return (
            <Panel key={card.card_id} className="flex aspect-square flex-col items-center justify-between gap-1 p-2 text-center">
              <span className="text-3xl" aria-hidden>
                {CATEGORY_ICONS[card.category]}
              </span>
              <p className="line-clamp-2 text-xs font-semibold text-[color:var(--color-text)]">{card.name}</p>
              {buyable ? (
                <Button
                  size="sm"
                  className="w-full px-1 text-xs"
                  disabled={busyCardId === card.card_id || !affordable}
                  onClick={() => handleBuy(card.card_id)}
                >
                  {money(price)}
                </Button>
              ) : (
                <p className="text-xs text-[color:var(--color-text-faint)]">{money(price)}</p>
              )}
            </Panel>
          )
        })}
      </div>
      {hand.length === 0 && <p className="text-sm text-[color:var(--color-text-faint)]">Your hand is empty.</p>}
    </div>
  )
}
