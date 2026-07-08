import { MARKET_REGIMES } from '@/content/marketRegimes'
import { INVESTMENTS } from '@/content/investments'
import type { MarketState } from '@/engine/types'

interface MarketTickerProps {
  market: MarketState
}

const REGIME_BADGE: Record<string, string> = {
  bull: 'text-emerald-glow',
  tech_boom: 'text-emerald-glow',
  bear: 'text-rose-glow',
  recession: 'text-rose-glow',
  crash: 'text-rose-glow',
  inflation: 'text-gold-glow',
  interest_rate: 'text-gold-glow',
  energy_crisis: 'text-gold-glow',
}

export function MarketTicker({ market }: MarketTickerProps) {
  const regime = MARKET_REGIMES[market.regime]

  return (
    <div className="flex items-center gap-4 overflow-x-auto rounded-xl bg-white/[0.04] px-4 py-2 text-xs">
      <span className={`shrink-0 font-semibold ${REGIME_BADGE[market.regime] ?? 'text-surface-200'}`}>
        🔔 {regime.name}
      </span>
      <span className="shrink-0 text-surface-500">
        Rate {Math.round(market.interestRate * 1000) / 10}%
      </span>
      <span className="shrink-0 text-surface-500">Next shift in {market.roundsRemaining}r</span>
      <div className="flex shrink-0 gap-3">
        {INVESTMENTS.slice(0, 6).map((inv) => {
          const price = market.prices[inv.id] ?? inv.basePrice
          const delta = price - inv.basePrice
          const up = delta >= 0
          return (
            <span key={inv.id} className="whitespace-nowrap text-surface-400">
              {inv.ticker} <span className={up ? 'text-emerald-glow' : 'text-rose-glow'}>${price.toFixed(2)}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
