import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAuthStore } from '@/stores/authStore'
import { useRoomStore } from '@/stores/roomStore'
import { useRealtimeRoom } from '@/hooks/useRealtimeRoom'
import { ChatPanel } from '@/components/game/ChatPanel'
import { kickPlayer, leaveRoom, roomErrorMessage, setReady, transferHost } from '@/lib/rooms'
import { startGame } from '@/lib/game'
import { money } from '@/lib/format'
import type { WinCondition } from '@/engine/types'
import { createInitialGameState, type NewPlayerInput } from '@/engine/createGame'

function winConditionLabel(wc: WinCondition): string {
  if (wc.type === 'target') return `First to ${money(wc.targetNetWorth)} net worth`
  if (wc.type === 'rounds') return `Highest net worth after ${wc.totalRounds} rounds`
  return 'Last player standing'
}

export function LobbyScreen() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const { room, players, profiles, presentProfileIds } = useRoomStore()
  const [starting, setStarting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const hasJoinedRef = useRef(false)
  const leavingRef = useRef(false)

  useRealtimeRoom(roomId, profile?.id)

  useEffect(() => {
    if (room?.status === 'in_game' && roomId) {
      navigate(`/room/${roomId}/game`, { replace: true })
    }
  }, [room?.status, roomId, navigate])

  const activePlayers = useMemo(() => players.filter((p) => !p.is_spectator).sort((a, b) => (a.seat ?? 0) - (b.seat ?? 0)), [players])
  const spectators = useMemo(() => players.filter((p) => p.is_spectator), [players])

  const selfPlayer = players.find((p) => p.profile_id === profile?.id)
  const isHost = room?.host_id === profile?.id
  const allReady = activePlayers.length >= 2 && activePlayers.every((p) => p.is_ready)

  useEffect(() => {
    if (selfPlayer) {
      hasJoinedRef.current = true
      return
    }
    if (hasJoinedRef.current && !leavingRef.current) {
      navigate('/home', { replace: true, state: { notice: 'You were removed from the room.' } })
    }
  }, [selfPlayer, navigate])

  async function handleToggleReady() {
    if (!roomId || !profile || !selfPlayer) return
    setActionError(null)
    try {
      await setReady(roomId, profile.id, !selfPlayer.is_ready)
    } catch (err) {
      setActionError(roomErrorMessage(err))
    }
  }

  async function handleKick(targetProfileId: string) {
    if (!roomId) return
    setActionError(null)
    try {
      await kickPlayer(roomId, targetProfileId)
    } catch (err) {
      setActionError(roomErrorMessage(err))
    }
  }

  async function handleTransferHost(targetProfileId: string) {
    if (!roomId) return
    setActionError(null)
    try {
      await transferHost(roomId, targetProfileId)
    } catch (err) {
      setActionError(roomErrorMessage(err))
    }
  }

  async function handleLeave() {
    if (!roomId) return
    leavingRef.current = true
    try {
      await leaveRoom(roomId)
    } finally {
      navigate('/home')
    }
  }

  async function handleStartGame() {
    if (!roomId || !room) return
    setStarting(true)
    setActionError(null)
    try {
      const playerInputs: NewPlayerInput[] = activePlayers.map((p) => ({
        id: p.profile_id,
        name: profiles[p.profile_id]?.username ?? 'Player',
        tokenColor: p.token_color ?? 'emerald',
        seat: p.seat ?? 0,
      }))
      const initialState = createInitialGameState(playerInputs, room.win_condition as unknown as WinCondition)
      await startGame(roomId, initialState)
      navigate(`/room/${roomId}/game`)
    } catch (err) {
      setActionError(roomErrorMessage(err))
    } finally {
      setStarting(false)
    }
  }

  if (!roomId) return null

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-surface-400">Loading room…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-10">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-50">{room.name}</h1>
          <p className="text-sm text-surface-400">
            {room.is_public ? 'Public' : `Private · Code ${room.code}`} · {winConditionLabel(room.win_condition as unknown as WinCondition)}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleLeave}>
          Leave Room
        </Button>
      </header>

      {actionError && <p className="text-sm text-rose-glow">{actionError}</p>}

      <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-3">
          {activePlayers.map((p, i) => {
            const playerProfile = profiles[p.profile_id]
            const online = presentProfileIds.has(p.profile_id)
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }}>
                <GlassCard className="flex items-center gap-3 p-4">
                  <div className="relative">
                    <Avatar name={playerProfile?.username ?? '?'} color={p.token_color ?? undefined} imageUrl={playerProfile?.avatar_url} />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface-900 ${online ? 'bg-emerald-glow' : 'bg-surface-500'}`}
                      title={online ? 'Online' : 'Reconnecting…'}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-surface-50">{playerProfile?.username ?? 'Player'}</span>
                      {p.is_host && (
                        <span className="rounded-full bg-gold-glow/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-gold-glow">
                          Host
                        </span>
                      )}
                      {!online && <span className="text-[11px] text-surface-400">Reconnecting…</span>}
                    </div>
                    <span className={`text-xs ${p.is_ready ? 'text-emerald-glow' : 'text-surface-400'}`}>
                      {p.is_ready ? 'Ready' : 'Not ready'}
                    </span>
                  </div>
                  {isHost && p.profile_id !== profile?.id && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleTransferHost(p.profile_id)}>
                        Make Host
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleKick(p.profile_id)}>
                        Kick
                      </Button>
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            )
          })}

          {spectators.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {spectators.map((s) => (
                <span key={s.id} className="rounded-full bg-white/[0.05] px-3 py-1 text-xs text-surface-400">
                  👁 {profiles[s.profile_id]?.username ?? 'Spectator'}
                </span>
              ))}
            </div>
          )}

          <div className="mt-2 flex gap-3">
            <Button className="flex-1" variant={selfPlayer?.is_ready ? 'secondary' : 'primary'} onClick={handleToggleReady} disabled={!selfPlayer}>
              {selfPlayer?.is_ready ? 'Not Ready' : 'Ready'}
            </Button>
            {isHost && (
              <Button className="flex-1" onClick={handleStartGame} disabled={!allReady} loading={starting}>
                Start Game
              </Button>
            )}
          </div>
        </div>

        <GlassCard className="flex h-[28rem] flex-col p-4">
          <h2 className="mb-2 text-sm font-semibold text-surface-300">Room Chat</h2>
          {roomId && profile && <ChatPanel roomId={roomId} profileId={profile.id} />}
        </GlassCard>
      </div>
    </div>
  )
}
