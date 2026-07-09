import { Panel } from '@/components/ui/Panel'
import { money } from '@/lib/format'
import { CATEGORY_LABELS } from '@/content/cards'
import type { HandCard } from '@/engine/types'

interface HandStripProps {
  hand: HandCard[]
}

/** Read-only hand display for phases other than Investment (where buying isn't allowed). */
export function HandStrip({ hand }: HandStripProps) {
  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
      {hand.map((card) => (
        <Panel key={card.card_id} className="flex w-48 shrink-0 flex-col gap-2 p-3 opacity-80">
          <div>
            <p className="text-xs uppercase tracking-wide text-[color:var(--color-text-faint)]">{CATEGORY_LABELS[card.category]}</p>
            <p className="text-sm font-semibold text-[color:var(--color-text)]">{card.name}</p>
          </div>
          <div className="mt-auto flex flex-col gap-1 text-xs text-[color:var(--color-text-faint)]">
            <span>Base Value: {money(card.base_value)}</span>
            <span>Passive Income: {money(card.passive_income)}/round</span>
          </div>
        </Panel>
      ))}
      {hand.length === 0 && <p className="text-sm text-[color:var(--color-text-faint)]">Your hand is empty.</p>}
    </div>
  )
}
