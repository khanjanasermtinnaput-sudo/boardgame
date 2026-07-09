import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { TextInput } from '@/components/ui/TextInput'
import { gameErrorMessage, hostAdjustPlayer, hostAdvanceRound, hostKick, hostSetPaused } from '@/lib/game'

interface HostControlPanelProps {
  gameId: string
  phase: number
  paused: boolean
  players: { profileId: string; username: string }[]
  selfProfileId: string
}

/** Host-only banker controls: start the round, pause/resume, adjust a player, kick a player. */
export function HostControlPanel({ gameId, phase, paused, players, selfProfileId }: HostControlPanelProps) {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [targetId, setTargetId] = useState(players.find((p) => p.profileId !== selfProfileId)?.profileId ?? '')
  const [cashDelta, setCashDelta] = useState(0)
  const [reason, setReason] = useState('')

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(gameErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel className="flex flex-col gap-3 border-[color:var(--color-red)] p-4">
      <h2 className="text-sm font-semibold text-[color:var(--color-red)]">Host Controls</h2>
      {error && <p className="text-sm text-[color:var(--color-red)]">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" disabled={busy || phase !== 1 || paused} onClick={() => run(() => hostAdvanceRound(gameId))}>
          Start Next Round
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => run(() => hostSetPaused(gameId, !paused))}
        >
          {paused ? 'Resume' : 'Pause'}
        </Button>
      </div>

      <div className="flex flex-col gap-2 border-t border-[color:var(--color-border)] pt-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text-faint)]">Adjust Player</h3>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-1 text-sm text-[color:var(--color-text)]"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
          >
            {players
              .filter((p) => p.profileId !== selfProfileId)
              .map((p) => (
                <option key={p.profileId} value={p.profileId}>
                  {p.username}
                </option>
              ))}
          </select>
          <TextInput
            type="number"
            step={100}
            value={cashDelta}
            onChange={(e) => setCashDelta(Number(e.target.value))}
            className="w-32"
            placeholder="Cash delta"
          />
          <TextInput value={reason} onChange={(e) => setReason(e.target.value)} className="w-40" placeholder="Reason" />
          <Button
            size="sm"
            variant="secondary"
            disabled={busy || !targetId}
            onClick={() =>
              run(() => hostAdjustPlayer(gameId, { targetProfileId: targetId, cashDelta, reason: reason || undefined }))
            }
          >
            Apply
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy || !targetId}
            onClick={() => run(() => hostKick(gameId, targetId))}
          >
            Kick
          </Button>
        </div>
      </div>
    </Panel>
  )
}
