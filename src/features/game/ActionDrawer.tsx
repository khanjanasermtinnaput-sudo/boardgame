import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { InvestmentPanel } from './panels/InvestmentPanel'
import { BusinessPanel } from './panels/BusinessPanel'
import { PropertyPanel } from './panels/PropertyPanel'
import { LoanPanel } from './panels/LoanPanel'
import { MorePanel } from './panels/MorePanel'
import type { GameAction } from '@/engine/actions'
import type { MarketState, PlayerState } from '@/engine/types'

type Tab = 'invest' | 'business' | 'property' | 'loan' | 'more'

const TABS: { id: Tab; label: string }[] = [
  { id: 'invest', label: 'Invest' },
  { id: 'business', label: 'Business' },
  { id: 'property', label: 'Property' },
  { id: 'loan', label: 'Loans' },
  { id: 'more', label: 'More' },
]

interface ActionDrawerProps {
  player: PlayerState
  market: MarketState
  round: number
  disabled: boolean
  onDispatch: (action: GameAction) => void
}

export function ActionDrawer({ player, market, round, disabled, onDispatch }: ActionDrawerProps) {
  const [tab, setTab] = useState<Tab>('invest')

  return (
    <GlassCard className="flex h-full flex-col p-4">
      <div className="mb-3 flex gap-1 overflow-x-auto rounded-xl bg-white/[0.04] p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.id ? 'bg-emerald-glow text-surface-950' : 'text-surface-300 hover:bg-white/[0.06]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {tab === 'invest' && <InvestmentPanel player={player} market={market} disabled={disabled} onDispatch={onDispatch} />}
        {tab === 'business' && <BusinessPanel player={player} disabled={disabled} onDispatch={onDispatch} />}
        {tab === 'property' && <PropertyPanel player={player} market={market} round={round} disabled={disabled} onDispatch={onDispatch} />}
        {tab === 'loan' && <LoanPanel player={player} disabled={disabled} onDispatch={onDispatch} />}
        {tab === 'more' && <MorePanel player={player} disabled={disabled} onDispatch={onDispatch} />}
      </div>
    </GlassCard>
  )
}
