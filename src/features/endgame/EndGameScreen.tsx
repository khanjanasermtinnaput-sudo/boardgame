import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { money } from '@/lib/format'
import { fetchGameResults, type GameResult } from '@/lib/game'
import { fetchProfilesByIds } from '@/lib/profiles'
import type { Profile } from '@/lib/auth'

interface EndGameScreenProps {
  roomId: string
}

export function EndGameScreen({ roomId }: EndGameScreenProps) {
  const navigate = useNavigate()
  const [results, setResults] = useState<GameResult[] | null>(null)
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})

  useEffect(() => {
    let cancelled = false
    async function load() {
      const r = await fetchGameResults(roomId)
      if (cancelled) return
      setResults(r)
      const p = await fetchProfilesByIds(r.map((x) => x.profile_id))
      if (!cancelled) setProfiles(p)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [roomId])

  if (!results) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-[color:var(--color-text-muted)]">Tallying final results…</p>
      </div>
    )
  }

  const winner = results[0]

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-red)]">Game Over — Age 70</p>
        <h1 className="mt-2 text-3xl font-bold text-[color:var(--color-text)]">
          {winner ? `${profiles[winner.profile_id]?.username ?? 'Player'} Wins!` : 'Game Over'}
        </h1>
      </div>

      <Panel className="flex flex-col divide-y divide-[color:var(--color-border)] p-0">
        {results.map((r, i) => (
          <div key={r.profile_id} className="flex items-center gap-4 p-4">
            <span className="w-6 text-center text-sm font-semibold text-[color:var(--color-text-faint)]">{i + 1}</span>
            <Avatar name={profiles[r.profile_id]?.username ?? '?'} imageUrl={profiles[r.profile_id]?.avatar_url} />
            <div className="flex-1">
              <p className="font-medium text-[color:var(--color-text)]">{profiles[r.profile_id]?.username ?? 'Player'}</p>
            </div>
            <p className={`text-lg font-semibold ${r.net_worth >= 0 ? 'text-[color:var(--color-gain)]' : 'text-[color:var(--color-loss)]'}`}>
              {money(r.net_worth)}
            </p>
          </div>
        ))}
      </Panel>

      <Button className="mx-auto" onClick={() => navigate('/home')}>
        Back to Home
      </Button>
    </div>
  )
}
