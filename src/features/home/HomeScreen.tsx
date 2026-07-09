import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Panel } from '@/components/ui/Panel'
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
    { label: 'Create Room', description: 'Host a new game', icon: '+', onClick: () => setCreateOpen(true) },
    { label: 'Join Room', description: 'Enter a room code', icon: '#', onClick: () => setJoinOpen(true) },
    { label: 'Profile', description: 'Your stats & avatar', icon: '@', onClick: () => navigate('/profile') },
    { label: 'Leaderboard', description: 'Top investors', icon: '*', onClick: () => navigate('/leaderboard') },
    { label: 'Settings', description: 'Preferences', icon: '=', onClick: () => navigate('/settings') },
  ]

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-4 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--color-text)]">Net Worth</h1>
          <p className="text-sm text-[color:var(--color-text-muted)]">Build your empire. Outgrow the rest.</p>
        </div>
        {profile && (
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 rounded-full py-1 pl-3 pr-1 hover:bg-[color:var(--color-surface)]"
          >
            <span className="text-sm font-medium text-[color:var(--color-text)]">{profile.username}</span>
            <Avatar name={profile.username} imageUrl={profile.avatar_url} />
          </button>
        )}
      </header>

      {notice && (
        <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 text-sm text-[color:var(--color-text-muted)]">
          {notice}
        </div>
      )}

      <Panel className="p-8 text-center" solid>
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-xl font-semibold text-[color:var(--color-text)]">Ready to play?</h2>
          <p className="max-w-sm text-sm text-[color:var(--color-text-muted)]">
            Jump into a public game right now, or set up your own room.
          </p>
          <Button size="lg" onClick={() => navigate('/play')}>
            Play Now
          </Button>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {tiles.map((tile) => (
          <button key={tile.label} type="button" onClick={tile.onClick} className="text-left">
            <Panel className="flex h-full flex-col gap-2 p-5 hover:bg-[color:var(--color-surface-alt)]">
              <span className="text-2xl text-[color:var(--color-red)]">{tile.icon}</span>
              <span className="font-medium text-[color:var(--color-text)]">{tile.label}</span>
              <span className="text-xs text-[color:var(--color-text-muted)]">{tile.description}</span>
            </Panel>
          </button>
        ))}
      </div>

      <CreateRoomModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <JoinRoomModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </div>
  )
}
