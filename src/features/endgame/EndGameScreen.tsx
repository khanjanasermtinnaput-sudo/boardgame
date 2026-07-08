import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
import { Avatar } from '@/components/ui/Avatar'
import { rankPlayers } from '@/engine/winConditions'
import { submitGameResult } from '@/lib/game'
import { money } from '@/lib/format'
import type { GameState } from '@/engine/types'

interface EndGameScreenProps {
  state: GameState
  roomId: string
  selfProfileId: string
}

export function EndGameScreen({ state, roomId, selfProfileId }: EndGameScreenProps) {
  const navigate = useNavigate()
  const ranking = rankPlayers(state)
  const submittedKey = `networth.resultSubmitted.${roomId}.${selfProfileId}`
  const [submitted, setSubmitted] = useState(false)
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    if (sessionStorage.getItem(submittedKey)) {
      setSubmitted(true)
      return
    }

    const self = ranking.find((r) => r.playerId === selfProfileId)
    if (!self) return

    // net worth + win/loss are read server-side from the host-computed
    // final_results the host wrote via finish_game — this call no longer
    // sends a self-reported claim (see submitGameResult in lib/game.ts).
    submitGameResult(roomId)
      .then(() => {
        sessionStorage.setItem(submittedKey, '1')
        setSubmitted(true)
      })
      .catch(() => {
        // Non-fatal — the results screen still renders even if the stats
        // write fails (e.g. transient network issue).
        setSubmitted(true)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="font-display text-3xl font-bold text-surface-50">Game Over</h1>
        <p className="mt-1 text-surface-400">
          {state.tiedPlayerIds && state.tiedPlayerIds.length > 1
            ? `It's a tie between ${state.tiedPlayerIds
                .map((id) => ranking.find((r) => r.playerId === id)?.name ?? 'a player')
                .join(' and ')}.`
            : state.winnerId
              ? `${ranking.find((r) => r.playerId === state.winnerId)?.name ?? 'A player'} wins!`
              : 'No one survived — the game ends with no winner.'}
        </p>
      </motion.div>

      <div className="flex flex-col gap-3">
        {ranking.map((row, i) => (
          <motion.div key={row.playerId} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.06 * i }}>
            <GlassCard
              className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center ${row.rank === 1 ? 'ring-2 ring-gold-glow/60' : ''}`}
              solid={row.rank === 1}
            >
              <div className="flex items-center gap-3 sm:w-56">
                <span className="w-6 text-center font-display text-lg font-bold text-surface-400">
                  {row.rank === 1 ? '🏆' : row.rank}
                </span>
                <Avatar name={row.name} />
                <div>
                  <p className="font-medium text-surface-50">
                    {row.name} {row.playerId === selfProfileId && <span className="text-xs text-surface-400">(you)</span>}
                  </p>
                  {row.bankrupt && <span className="text-[10px] font-semibold uppercase text-rose-glow">Bankrupt</span>}
                </div>
              </div>

              <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-6">
                <Stat label="Net Worth" value={money(row.netWorth)} highlight />
                <Stat label="Cash" value={money(row.cash)} />
                <Stat label="Assets" value={money(row.totalAssets)} />
                <Stat label="Liabilities" value={money(row.totalLiabilities)} />
                <Stat label="Income" value={money(row.income)} />
                <Stat label="Holdings" value={`${row.businesses}🏪 ${row.properties}🏠`} />
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center gap-3">
        <Button onClick={() => navigate('/home')} disabled={!submitted}>
          Back to Home
        </Button>
      </div>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-surface-500">{label}</p>
      <p className={highlight ? 'font-semibold text-emerald-glow' : 'text-surface-200'}>{value}</p>
    </div>
  )
}
