import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAuthStore } from '@/stores/authStore'
import { money } from '@/lib/format'

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <GlassCard className="flex flex-col gap-1 p-4">
      <span className="text-xs uppercase tracking-wide text-surface-400">{label}</span>
      <span className="font-display text-xl font-semibold text-surface-50">{value}</span>
    </GlassCard>
  )
}

export function ProfileScreen() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)

  if (!profile) return null

  const winRate = profile.games_played > 0 ? Math.round((profile.wins / profile.games_played) * 100) : 0

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-surface-50">Profile</h1>
        <Button variant="secondary" size="sm" onClick={() => navigate('/home')}>
          Back
        </Button>
      </header>

      <GlassCard className="flex items-center gap-4 p-6" solid>
        <Avatar name={profile.username} imageUrl={profile.avatar_url} size="lg" />
        <div>
          <p className="font-display text-xl font-semibold text-surface-50">{profile.username}</p>
          <p className="text-sm text-surface-400">Investor since day one</p>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Games Played" value={String(profile.games_played)} />
        <StatTile label="Wins" value={String(profile.wins)} />
        <StatTile label="Win Rate" value={`${winRate}%`} />
        <StatTile label="Best Net Worth" value={money(profile.best_net_worth)} />
      </div>
    </div>
  )
}
