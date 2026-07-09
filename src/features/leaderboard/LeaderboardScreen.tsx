import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { useAuthStore } from '@/stores/authStore'
import { fetchLeaderboard, type LeaderboardEntry } from '@/lib/profiles'
import { money } from '@/lib/format'

export function LeaderboardScreen() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchLeaderboard()
      .then((data) => !cancelled && setEntries(data))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Failed to load leaderboard.'))
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[color:var(--color-text)]">Leaderboard</h1>
        <Button variant="secondary" size="sm" onClick={() => navigate('/home')}>
          Back
        </Button>
      </header>

      {error && <p className="text-sm text-[color:var(--color-red)]">{error}</p>}
      {entries === null && !error && <p className="text-sm text-[color:var(--color-text-muted)]">Loading…</p>}

      <div className="flex flex-col gap-2">
        {entries?.map((entry) => (
          <Panel
            key={entry.id}
            className={`flex items-center gap-4 p-4 ${entry.id === profile?.id ? 'border-[color:var(--color-red)]' : ''}`}
          >
            <span className="w-8 text-center text-lg font-bold text-[color:var(--color-text-faint)]">{entry.rank}</span>
            <Avatar name={entry.username} imageUrl={entry.avatar_url} />
            <div className="flex-1">
              <p className="font-medium text-[color:var(--color-text)]">{entry.username}</p>
              <p className="text-xs text-[color:var(--color-text-muted)]">
                {entry.wins} wins · {entry.games_played} games
              </p>
            </div>
            <span className="font-semibold text-[color:var(--color-gain)]">{money(entry.best_net_worth)}</span>
          </Panel>
        ))}
      </div>
    </div>
  )
}
