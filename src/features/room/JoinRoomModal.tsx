import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/TextInput'
import { joinRoomByCode, roomErrorMessage } from '@/lib/rooms'

interface JoinRoomModalProps {
  open: boolean
  onClose: () => void
}

export function JoinRoomModal({ open, onClose }: JoinRoomModalProps) {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = /^\d{4}$/.test(code) && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const room = await joinRoomByCode(code)
      onClose()
      navigate(`/room/${room.id}/lobby`)
    } catch (err) {
      setError(roomErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Join Room">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextInput
          label="4-Digit Room Code"
          placeholder="0000"
          value={code}
          maxLength={4}
          autoFocus
          inputMode="numeric"
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
        />
        {error && <p className="text-sm text-[color:var(--color-red)]">{error}</p>}
        <div className="mt-2 flex gap-3">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={!canSubmit} loading={submitting}>
            Join
          </Button>
        </div>
      </form>
    </Modal>
  )
}
