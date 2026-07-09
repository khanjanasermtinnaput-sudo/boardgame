import { Panel } from '@/components/ui/Panel'
import { money } from '@/lib/format'
import { CATEGORY_LABELS, type CardCategory } from '@/content/cards'
import { phaseName } from '@/hooks/useGameState'
import type { GlobalEventState, IncomeSummary, PersonalEventState } from '@/engine/types'

interface PhaseCenterPanelProps {
  phase: number
  globalEvent: GlobalEventState | null
  personalEvent: PersonalEventState | null
  incomeSummary: IncomeSummary | null
}

function GlobalEventBody({ event }: { event: GlobalEventState }) {
  const typeLabel =
    event.type === 'positive_market' ? 'Positive Market' : event.type === 'economic_slowdown' ? 'Economic Slowdown' : 'Black Event'
  const entries = Object.entries(event.effects) as Array<[CardCategory, number]>

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-red)]">{typeLabel}</span>
      <h3 className="text-xl font-bold text-[color:var(--color-text)]">{event.name}</h3>
      <p className="text-sm text-[color:var(--color-text-muted)]">{event.description}</p>
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {entries.map(([category, multiplier]) => (
            <span key={category} className="rounded-md border border-[color:var(--color-border)] px-2 py-1 text-xs text-[color:var(--color-text-muted)]">
              {CATEGORY_LABELS[category]}: {multiplier >= 1 ? '+' : ''}
              {Math.round((multiplier - 1) * 100)}%
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function PersonalEventBody({ event }: { event: PersonalEventState }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xl font-bold text-[color:var(--color-text)]">{event.name}</h3>
      <p className="text-sm text-[color:var(--color-text-muted)]">{event.description}</p>
    </div>
  )
}

function IncomeSummaryBody({ summary }: { summary: IncomeSummary }) {
  const row = (label: string, value: number, negative = false) => (
    <div className="flex items-center justify-between border-b border-[color:var(--color-border)] py-1.5 text-sm last:border-b-0">
      <span className="text-[color:var(--color-text-muted)]">{label}</span>
      <span className={negative ? 'text-[color:var(--color-loss)]' : 'text-[color:var(--color-text)]'}>
        {negative ? '-' : '+'}
        {money(Math.abs(value))}
      </span>
    </div>
  )

  return (
    <div className="flex flex-col">
      {row('Salary', summary.salary)}
      {row('Passive Income', summary.passive_income)}
      {row('Living Cost', summary.living_cost, true)}
      {row('Maintenance', summary.maintenance, true)}
      {row('Tax', summary.tax, true)}
      {summary.debt_count > 0 && row(`Loan Interest (${Math.round(summary.interest_rate * 100)}%)`, summary.interest_total, true)}
      <div className="mt-2 flex items-center justify-between pt-2 text-sm font-semibold">
        <span className="text-[color:var(--color-text)]">Net Change</span>
        <span className={summary.net_change >= 0 ? 'text-[color:var(--color-gain)]' : 'text-[color:var(--color-loss)]'}>
          {summary.net_change >= 0 ? '+' : ''}
          {money(summary.net_change)}
        </span>
      </div>
    </div>
  )
}

export function PhaseCenterPanel({ phase, globalEvent, personalEvent, incomeSummary }: PhaseCenterPanelProps) {
  return (
    <Panel className="flex min-h-[14rem] flex-col gap-4 p-8">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--color-text-faint)]">{phaseName(phase)}</h2>

      {phase === 1 && (
        <p className="text-sm text-[color:var(--color-text-muted)]">
          Waiting for the host to start the round — the dice roll reveals this round's market tile.
        </p>
      )}

      {phase === 2 && (
        <div className="flex flex-col gap-3">
          {globalEvent ? (
            <GlobalEventBody event={globalEvent} />
          ) : (
            <p className="text-sm text-[color:var(--color-text-faint)]">Waiting for the market tile to resolve…</p>
          )}
          <p className="text-sm text-[color:var(--color-text-muted)]">
            Buy asset cards from your hand below, use the Bank to borrow, repay, or sell any time. Press Ready when you're done.
          </p>
        </div>
      )}

      {phase === 3 && (personalEvent ? <PersonalEventBody event={personalEvent} /> : (
        <p className="text-sm text-[color:var(--color-text-faint)]">Waiting for your Personal Event…</p>
      ))}

      {phase === 4 && (incomeSummary ? <IncomeSummaryBody summary={incomeSummary} /> : (
        <p className="text-sm text-[color:var(--color-text-faint)]">Calculating income and expenses…</p>
      ))}

      {phase === 5 && <p className="text-sm text-[color:var(--color-text-muted)]">Your investment hand has been refilled to 4 cards.</p>}
    </Panel>
  )
}
