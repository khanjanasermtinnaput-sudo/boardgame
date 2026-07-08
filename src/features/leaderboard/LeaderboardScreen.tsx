import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
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
        <h1 className="font-display text-2xl font-bold text-surface-50">Leaderboard</h1>
        <Button variant="secondary" size="sm" onClick={() => navigate('/home')}>
          Back
        </Button>
      </header>

      {error && <p className="text-sm text-rose-glow">{error}</p>}
      {entries === null && !error && <p className="text-sm text-surface-400">Loading…</p>}

      <div className="flex flex-col gap-2">
        {entries?.map((entry, i) => (
          <motion.div key={entry.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 * i }}>
            <GlassCard
              className={`flex items-center gap-4 p-4 ${entry.id === profile?.id ? 'ring-1 ring-emerald-glow/50' : ''}`}
            >
              <span className="w-8 text-center font-display text-lg font-bold text-surface-400">
                {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
              </span>
              <Avatar name={entry.username} imageUrl={entry.avatar_url} />
              <div className="flex-1">
                <p className="font-medium text-surface-50">{entry.username}</p>
                <p className="text-xs text-surface-400">
                  {entry.wins} wins · {entry.games_played} games
                </p>
              </div>
              <span className="font-display font-semibold text-emerald-glow">
                {money(entry.best_net_worth)}
              </span>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
