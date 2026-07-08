import { GlassCard } from '@/components/ui/GlassCard'
import { Avatar } from '@/components/ui/Avatar'
import type { MarketState, PlayerState } from '@/engine/types'
import { netWorth, totalPassiveIncome, totalExpenses, totalLoanBalance } from '@/engine/economy'
import { money } from '@/lib/format'

interface PlayerDashboardProps {
  player: PlayerState
  market: MarketState
  round: number
  isCurrentTurn: boolean
  isSelf: boolean
}

export function PlayerDashboard({ player, market, round, isCurrentTurn, isSelf }: PlayerDashboardProps) {
  const nw = netWorth(player, market, round)
  const income = totalPassiveIncome(player, market)
  const expenses = totalExpenses(player)
  const liabilities = totalLoanBalance(player)

  return (
    <GlassCard
      className={`flex flex-col gap-2 p-3 transition-shadow ${isCurrentTurn ? 'ring-2 ring-emerald-glow/60' : ''} ${player.bankrupt ? 'opacity-50 grayscale' : ''}`}
    >
      <div className="flex items-center gap-2">
        <Avatar name={player.name} color={player.tokenColor} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-surface-50">
            {player.name}
            {isSelf && <span className="text-surface-400"> (you)</span>}
          </p>
          {player.bankrupt && <span className="text-[10px] font-semibold uppercase text-rose-glow">Bankrupt</span>}
        </div>
        {isCurrentTurn && <span className="rounded-full bg-emerald-glow/20 px-2 py-0.5 text-[10px] text-emerald-glow">Turn</span>}
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
        <span className="text-surface-400">Net Worth</span>
        <span className="text-right font-semibold text-surface-50">{money(nw)}</span>
        <span className="text-surface-400">Cash</span>
        <span className="text-right text-surface-200">{money(player.cash)}</span>
        <span className="text-surface-400">Income</span>
        <span className="text-right text-emerald-glow">{money(income)}</span>
        <span className="text-surface-400">Expenses</span>
        <span className="text-right text-rose-glow">{money(expenses)}</span>
        {liabilities > 0 && (
          <>
            <span className="text-surface-400">Liabilities</span>
            <span className="text-right text-rose-glow">{money(liabilities)}</span>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-1 text-[10px] text-surface-400">
        {player.businesses.length > 0 && <span>🏪 {player.businesses.length}</span>}
        {player.properties.length > 0 && <span>🏠 {player.properties.length}</span>}
        {player.investments.length > 0 && <span>📈 {player.investments.length}</span>}
        {player.insured && <span>🛡️ Insured</span>}
        {player.educated && <span>🎓 Educated</span>}
      </div>
    </GlassCard>
  )
}
