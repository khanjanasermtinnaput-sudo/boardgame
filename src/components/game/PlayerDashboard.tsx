import { money } from '@/lib/format'
import type { GamePlayer } from '@/lib/game'

interface PlayerDashboardProps {
  player: GamePlayer
  age: number
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'gain' | 'loss' }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-[color:var(--color-text-faint)]">{label}</span>
      <span
        className={
          tone === 'gain'
            ? 'text-base font-semibold text-[color:var(--color-gain)]'
            : tone === 'loss'
              ? 'text-base font-semibold text-[color:var(--color-loss)]'
              : 'text-base font-semibold text-[color:var(--color-text)]'
        }
      >
        {value}
      </span>
    </div>
  )
}

export function PlayerDashboard({ player, age }: PlayerDashboardProps) {
  const totalDebt = (player.debts as Array<{ outstanding: number }>).reduce((sum, d) => sum + d.outstanding, 0)

  return (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
      <Stat label="Cash" value={money(player.cash)} />
      <Stat label="Net Worth" value={money(player.net_worth)} tone={player.net_worth >= 0 ? 'gain' : 'loss'} />
      <Stat label="Debt" value={money(totalDebt)} tone={totalDebt > 0 ? 'loss' : undefined} />
      <Stat label="Passive Income" value={money(player.passive_income)} />
      <Stat label="Age" value={String(age)} />
      <Stat label="Ready" value={player.ready ? 'Yes' : 'No'} tone={player.ready ? 'gain' : undefined} />
    </div>
  )
}
