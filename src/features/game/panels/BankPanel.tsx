import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { TextInput } from '@/components/ui/TextInput'
import { money } from '@/lib/format'
import { gameErrorMessage, borrow, repay, sellAsset } from '@/lib/game'
import { sellPrice } from '@/engine/netWorth'
import { CATEGORY_LABELS } from '@/content/cards'
import type { AssetInstance, DebtCard, MarketMultipliers } from '@/engine/types'

interface BankPanelProps {
  gameId: string
  assets: AssetInstance[]
  debts: DebtCard[]
  cash: number
  market: MarketMultipliers
}

/** Always-on borrow / repay / sell surface — available in every phase, not gated to Buy. */
export function BankPanel({ gameId, assets, debts, cash, market }: BankPanelProps) {
  const [error, setError] = useState<string | null>(null)
  const [busyInstanceId, setBusyInstanceId] = useState<string | null>(null)
  const [borrowAmount, setBorrowAmount] = useState(1000)
  const [showPortfolio, setShowPortfolio] = useState(false)

  async function handleSell(instanceId: string) {
    setBusyInstanceId(instanceId)
    setError(null)
    try {
      await sellAsset(gameId, instanceId)
    } catch (err) {
      setError(gameErrorMessage(err))
    } finally {
      setBusyInstanceId(null)
    }
  }

  async function handleBorrow() {
    setError(null)
    try {
      await borrow(gameId, borrowAmount)
    } catch (err) {
      setError(gameErrorMessage(err))
    }
  }

  async function handleRepay(debtId: string, outstanding: number) {
    setError(null)
    try {
      await repay(gameId, debtId, outstanding)
    } catch (err) {
      setError(gameErrorMessage(err))
    }
  }

  return (
    <Panel className="flex flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold text-[color:var(--color-text-muted)]">Bank</h2>
      {error && <p className="text-sm text-[color:var(--color-red)]">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <TextInput
            type="number"
            min={100}
            step={100}
            value={borrowAmount}
            onChange={(e) => setBorrowAmount(Number(e.target.value))}
            className="w-32"
          />
          <Button size="sm" variant="secondary" onClick={handleBorrow}>
            Borrow
          </Button>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setShowPortfolio((v) => !v)}>
          {showPortfolio ? 'Hide Portfolio' : 'Review Portfolio'}
        </Button>
        <span className="text-sm text-[color:var(--color-text-muted)]">Cash: {money(cash)}</span>
      </div>

      {showPortfolio && (
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[color:var(--color-text-muted)]">Owned Assets</h3>
            {assets.length === 0 && <p className="text-sm text-[color:var(--color-text-faint)]">No assets owned yet.</p>}
            <div className="flex flex-col gap-2">
              {assets.map((a) => (
                <div key={a.instance_id} className="flex items-center justify-between rounded-md border border-[color:var(--color-border)] px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-[color:var(--color-text)]">{a.name}</p>
                    <p className="text-xs text-[color:var(--color-text-faint)]">
                      {CATEGORY_LABELS[a.category]} · Base {money(a.base_value)} · Income {money(a.passive_income)}/round
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busyInstanceId === a.instance_id}
                    onClick={() => handleSell(a.instance_id)}
                  >
                    Sell for {money(sellPrice(a.base_value, market, a.category))}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-[color:var(--color-text-muted)]">Debts</h3>
            {debts.length === 0 && <p className="text-sm text-[color:var(--color-text-faint)]">No outstanding debt.</p>}
            <div className="flex flex-col gap-2">
              {debts.map((d) => (
                <div key={d.debt_id} className="flex items-center justify-between rounded-md border border-[color:var(--color-border)] px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-[color:var(--color-text)]">Outstanding: {money(d.outstanding)}</p>
                    <p className="text-xs text-[color:var(--color-text-faint)]">Principal {money(d.principal)} · Taken at age {d.created_age}</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => handleRepay(d.debt_id, d.outstanding)}>
                    Repay in Full
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Panel>
  )
}
