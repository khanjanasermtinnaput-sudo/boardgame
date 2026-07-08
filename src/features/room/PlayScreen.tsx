import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { joinPublicRoom, listPublicRooms, type Room } from '@/lib/rooms'
import { JoinRoomModal } from '@/features/room/JoinRoomModal'
import { CreateRoomModal } from '@/features/room/CreateRoomModal'

export function PlayScreen() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState<Room[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    listPublicRooms()
      .then((r) => !cancelled && setRooms(r))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Failed to load rooms.'))
    return () => {
      cancelled = true
    }
  }, [])

  async function handleQuickJoin(room: Room) {
    setJoiningId(room.id)
    setError(null)
    try {
      await joinPublicRoom(room.id)
      navigate(`/room/${room.id}/lobby`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join that room.')
      setJoiningId(null)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-50">Play Now</h1>
          <p className="text-sm text-surface-400">Join a public game or start your own.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/home')}>
          Back
        </Button>
      </header>

      <div className="flex gap-3">
        <Button className="flex-1" onClick={() => setCreateModalOpen(true)}>
          Create Room
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => setJoinModalOpen(true)}>
          Join by Code
        </Button>
      </div>

      {error && <p className="text-sm text-rose-glow">{error}</p>}

      <div className="flex flex-col gap-3">
        {rooms === null && <p className="text-sm text-surface-400">Loading public rooms…</p>}
        {rooms !== null && rooms.length === 0 && (
          <GlassCard className="p-6 text-center text-sm text-surface-400">
            No public rooms right now — why not create one?
          </GlassCard>
        )}
        {rooms?.map((room, i) => (
          <motion.div
            key={room.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 * i }}
          >
            <GlassCard className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-surface-50">{room.name}</p>
                <p className="text-xs text-surface-400">Up to {room.max_players} players</p>
              </div>
              <Button size="sm" loading={joiningId === room.id} onClick={() => handleQuickJoin(room)}>
                Join
              </Button>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <JoinRoomModal open={joinModalOpen} onClose={() => setJoinModalOpen(false)} />
      <CreateRoomModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />
    </div>
  )
}
