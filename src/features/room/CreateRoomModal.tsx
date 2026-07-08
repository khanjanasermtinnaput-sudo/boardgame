import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/TextInput'
import { createRoom } from '@/lib/rooms'
import type { WinCondition } from '@/engine/types'

interface CreateRoomModalProps {
  open: boolean
  onClose: () => void
}

type WinType = WinCondition['type']

export function CreateRoomModal({ open, onClose }: CreateRoomModalProps) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [isPublic, setIsPublic] = useState(true)
  const [winType, setWinType] = useState<WinType>('target')
  const [targetNetWorth, setTargetNetWorth] = useState(1_000_000)
  const [totalRounds, setTotalRounds] = useState(30)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = name.trim().length > 0 && name.length <= 40 && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const winCondition: WinCondition =
        winType === 'target'
          ? { type: 'target', targetNetWorth }
          : winType === 'rounds'
            ? { type: 'rounds', totalRounds }
            : { type: 'survival' }

      const room = await createRoom({ name: name.trim(), maxPlayers, isPublic, winCondition })
      onClose()
      navigate(`/room/${room.id}/lobby`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Room">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextInput
          label="Room Name"
          placeholder="e.g. Friday Night Finance"
          value={name}
          maxLength={40}
          autoFocus
          onChange={(e) => setName(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-surface-300" htmlFor="maxPlayers">
            Player Limit: {maxPlayers}
          </label>
          <input
            id="maxPlayers"
            type="range"
            min={2}
            max={10}
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
            className="accent-emerald-glow"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-surface-300">Room Type</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsPublic(true)}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm transition-colors ${isPublic ? 'border-emerald-glow bg-emerald-glow/10 text-emerald-glow' : 'border-white/10 text-surface-400'}`}
            >
              Public
            </button>
            <button
              type="button"
              onClick={() => setIsPublic(false)}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm transition-colors ${!isPublic ? 'border-emerald-glow bg-emerald-glow/10 text-emerald-glow' : 'border-white/10 text-surface-400'}`}
            >
              Private
            </button>
          </div>
          {!isPublic && (
            <p className="text-xs text-surface-400">
              A random 4-digit room code will be generated once the room is created.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-surface-300">Win Condition</span>
          <select
            value={winType}
            onChange={(e) => setWinType(e.target.value as WinType)}
            className="h-11 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-sm text-surface-50 outline-none focus:border-emerald-glow/60"
          >
            <option value="target">First to reach a net worth target</option>
            <option value="rounds">Highest net worth after N rounds</option>
            <option value="survival">Last player standing</option>
          </select>
          {winType === 'target' && (
            <TextInput
              type="number"
              min={100_000}
              step={50_000}
              value={targetNetWorth}
              onChange={(e) => setTargetNetWorth(Number(e.target.value))}
            />
          )}
          {winType === 'rounds' && (
            <TextInput
              type="number"
              min={10}
              max={100}
              value={totalRounds}
              onChange={(e) => setTotalRounds(Number(e.target.value))}
            />
          )}
        </div>

        {error && <p className="text-sm text-rose-glow">{error}</p>}

        <div className="mt-2 flex gap-3">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={!canSubmit} loading={submitting}>
            Create Room
          </Button>
        </div>
      </form>
    </Modal>
  )
}
