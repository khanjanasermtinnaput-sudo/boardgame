import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { TextInput } from '@/components/ui/TextInput'
import { money } from '@/lib/format'
import { gameErrorMessage, borrow, buyCard, repay, sellAsset } from '@/lib/game'
import { buyPrice, sellPrice } from '@/engine/netWorth'
import { CATEGORY_LABELS } from '@/content/cards'
import type { AssetInstance, DebtCard, HandCard, MarketMultipliers } from '@/engine/types'

interface InvestmentPanelProps {
  gameId: string
  hand: HandCard[]
  assets: AssetInstance[]
  debts: DebtCard[]
  cash: number
  market: MarketMultipliers
}

export function InvestmentPanel({ gameId, hand, assets, debts, cash, market }: InvestmentPanelProps) {
  const [error, setError] = useState<string | null>(null)
  const [busyCardId, setBusyCardId] = useState<string | null>(null)
  const [borrowAmount, setBorrowAmount] = useState(1000)
  const [showPortfolio, setShowPortfolio] = useState(false)

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

  async function handleSell(instanceId: string) {
    setBusyCardId(instanceId)
    setError(null)
    try {
      await sellAsset(gameId, instanceId)
    } catch (err) {
      setError(gameErrorMessage(err))
    } finally {
      setBusyCardId(null)
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
    <div className="flex flex-col gap-3">
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
        <Panel className="flex flex-col gap-3 p-4">
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
                    disabled={busyCardId === a.instance_id}
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
        </Panel>
      )}

      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {hand.map((card) => (
          <Panel key={card.card_id} className="flex w-48 shrink-0 flex-col gap-2 p-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-[color:var(--color-text-faint)]">{CATEGORY_LABELS[card.category]}</p>
              <p className="text-sm font-semibold text-[color:var(--color-text)]">{card.name}</p>
            </div>
            <p className="line-clamp-3 text-xs text-[color:var(--color-text-muted)]">{card.description}</p>
            <div className="mt-auto flex flex-col gap-1 text-xs text-[color:var(--color-text-faint)]">
              <span>Base Value: {money(card.base_value)}</span>
              <span>Passive Income: {money(card.passive_income)}/round</span>
            </div>
            <Button
              size="sm"
              disabled={busyCardId === card.card_id || cash < buyPrice(card.purchase_price, market, card.category)}
              onClick={() => handleBuy(card.card_id)}
            >
              Buy for {money(buyPrice(card.purchase_price, market, card.category))}
            </Button>
          </Panel>
        ))}
        {hand.length === 0 && <p className="text-sm text-[color:var(--color-text-faint)]">Your hand is empty.</p>}
      </div>
    </div>
  )
}
