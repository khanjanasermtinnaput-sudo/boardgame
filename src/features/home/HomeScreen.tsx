import { useState } from 'react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { CreateRoomModal } from '@/features/room/CreateRoomModal'
import { JoinRoomModal } from '@/features/room/JoinRoomModal'

interface Tile {
  label: string
  description: string
  icon: string
  onClick: () => void
}

export function HomeScreen() {
  const profile = useAuthStore((s) => s.profile)
  const navigate = useNavigate()
  const location = useLocation()
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const notice = (location.state as { notice?: string } | null)?.notice

  const tiles: Tile[] = [
    { label: 'Create Room', description: 'Host a new game', icon: '➕', onClick: () => setCreateOpen(true) },
    { label: 'Join Room', description: 'Enter a room code', icon: '🔑', onClick: () => setJoinOpen(true) },
    { label: 'Profile', description: 'Your stats & avatar', icon: '👤', onClick: () => navigate('/profile') },
    { label: 'Leaderboard', description: 'Top investors', icon: '🏆', onClick: () => navigate('/leaderboard') },
    { label: 'Settings', description: 'Preferences', icon: '⚙️', onClick: () => navigate('/settings') },
  ]

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-4 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-50">Net Worth</h1>
          <p className="text-sm text-surface-400">Build your empire. Outgrow the rest.</p>
        </div>
        {profile && (
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 rounded-full pl-3 pr-1 py-1 transition-colors hover:bg-white/[0.05]"
          >
            <span className="text-sm font-medium text-surface-200">{profile.username}</span>
            <Avatar name={profile.username} imageUrl={profile.avatar_url} />
          </button>
        )}
      </header>

      {notice && (
        <div className="rounded-xl border border-gold-glow/30 bg-gold-glow/10 px-4 py-3 text-sm text-gold-glow">
          {notice}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <GlassCard className="relative overflow-hidden p-8 text-center" solid>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-glow/10 via-transparent to-violet-glow/10" />
          <div className="relative flex flex-col items-center gap-4">
            <h2 className="font-display text-xl font-semibold text-surface-50">Ready to play?</h2>
            <p className="max-w-sm text-sm text-surface-400">
              Jump into a public game right now, or set up your own room.
            </p>
            <Button size="lg" onClick={() => navigate('/play')}>
              Play Now
            </Button>
          </div>
        </GlassCard>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {tiles.map((tile, i) => (
          <motion.button
            key={tile.label}
            type="button"
            onClick={tile.onClick}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 * i }}
            whileHover={{ y: -2 }}
            className="text-left"
          >
            <GlassCard className="flex h-full flex-col gap-2 p-5 transition-colors hover:bg-white/[0.06]">
              <span className="text-2xl">{tile.icon}</span>
              <span className="font-medium text-surface-50">{tile.label}</span>
              <span className="text-xs text-surface-400">{tile.description}</span>
            </GlassCard>
          </motion.button>
        ))}
      </div>

      <CreateRoomModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <JoinRoomModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </div>
  )
}
