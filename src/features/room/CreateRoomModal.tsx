import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/TextInput'
import { createRoom } from '@/lib/rooms'

interface CreateRoomModalProps {
  open: boolean
  onClose: () => void
}

export function CreateRoomModal({ open, onClose }: CreateRoomModalProps) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [isPublic, setIsPublic] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = name.trim().length > 0 && name.length <= 40 && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const room = await createRoom({ name: name.trim(), maxPlayers, isPublic })
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
          <label className="text-sm font-medium text-[color:var(--color-text-muted)]" htmlFor="maxPlayers">
            Player Limit: {maxPlayers}
          </label>
          <input
            id="maxPlayers"
            type="range"
            min={2}
            max={10}
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
            className="accent-[color:var(--color-red)]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[color:var(--color-text-muted)]">Room Type</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsPublic(true)}
              className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                isPublic
                  ? 'border-[color:var(--color-red)] text-[color:var(--color-red)]'
                  : 'border-[color:var(--color-border)] text-[color:var(--color-text-muted)]'
              }`}
            >
              Public
            </button>
            <button
              type="button"
              onClick={() => setIsPublic(false)}
              className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                !isPublic
                  ? 'border-[color:var(--color-red)] text-[color:var(--color-red)]'
                  : 'border-[color:var(--color-border)] text-[color:var(--color-text-muted)]'
              }`}
            >
              Private
            </button>
          </div>
          {!isPublic && (
            <p className="text-xs text-[color:var(--color-text-faint)]">
              A random 4-digit room code will be generated once the room is created.
            </p>
          )}
        </div>

        {error && <p className="text-sm text-[color:var(--color-red)]">{error}</p>}

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
