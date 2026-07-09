import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { PlayerDashboard } from '@/components/game/PlayerDashboard'
import { HandGrid } from '@/components/game/HandGrid'
import { CircularBoard } from '@/components/game/CircularBoard'
import { PhaseCenterPanel } from '@/components/game/PhaseCenterPanel'
import { ChatPanel } from '@/components/game/ChatPanel'
import { BankPanel } from '@/features/game/panels/BankPanel'
import { HostControlPanel } from '@/features/game/panels/HostControlPanel'
import { EndGameScreen } from '@/features/endgame/EndGameScreen'
import { useAuthStore } from '@/stores/authStore'
import { useRoomStore } from '@/stores/roomStore'
import { useGameStore } from '@/stores/gameStore'
import { useRealtimeRoom } from '@/hooks/useRealtimeRoom'
import { useGameState, phaseName } from '@/hooks/useGameState'
import { gameErrorMessage, setGameReady } from '@/lib/game'
import type {
  AssetInstance,
  DebtCard,
  GlobalEventState,
  HandCard,
  IncomeSummary,
  MarketMultipliers,
  PersonalEventState,
  RollState,
} from '@/engine/types'

export function GameScreen() {
  const { roomId } = useParams<{ roomId: string }>()
  const profile = useAuthStore((s) => s.profile)
  const room = useRoomStore((s) => s.room)
  const { game, players } = useGameStore()
  const history = useGameStore((s) => s.history)
  const profiles = useRoomStore((s) => s.profiles)
  const roomPlayers = useRoomStore((s) => s.players)
  const [chatOpen, setChatOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [readyError, setReadyError] = useState<string | null>(null)
  const [togglingReady, setTogglingReady] = useState(false)

  useRealtimeRoom(roomId, profile?.id)
  useGameState(roomId, profile?.id)

  const playerList = useMemo(() => Object.values(players).sort((a, b) => a.seat - b.seat), [players])
  const readyCount = playerList.filter((p) => p.ready).length
  const self = profile ? players[profile.id] : undefined
  const isHost = room?.host_id === profile?.id

  async function handleToggleReady() {
    if (!game || !self) return
    setTogglingReady(true)
    setReadyError(null)
    try {
      await setGameReady(game.id, !self.ready)
    } catch (err) {
      setReadyError(gameErrorMessage(err))
    } finally {
      setTogglingReady(false)
    }
  }

  if (!roomId) return null

  if (!game || !profile || !self || playerList.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-[color:var(--color-text-muted)]">Loading game…</p>
      </div>
    )
  }

  if (game.status === 'finished') {
    return <EndGameScreen roomId={roomId} />
  }

  const hand = self.hand as unknown as HandCard[]
  const assets = self.assets as unknown as AssetInstance[]
  const debts = self.debts as unknown as DebtCard[]
  const market = game.market as unknown as MarketMultipliers
  const globalEvent = 'id' in (game.global_event as object) ? (game.global_event as unknown as GlobalEventState) : null
  const personalEvent = 'id' in (self.personal_event as object) ? (self.personal_event as unknown as PersonalEventState) : null
  const incomeSummary =
    'net_change' in (self.income_summary as object) ? (self.income_summary as unknown as IncomeSummary) : null
  const lastRoll = 'tile_index' in (game.last_roll as object) ? (game.last_roll as unknown as RollState) : null

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--color-border)] pb-4">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-[color:var(--color-text-faint)]">Age</p>
            <p className="text-lg font-bold text-[color:var(--color-text)]">{game.age}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[color:var(--color-text-faint)]">Phase</p>
            <p className="text-lg font-bold text-[color:var(--color-text)]">{phaseName(game.phase)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[color:var(--color-text-faint)]">Ready</p>
            <p className="text-lg font-bold text-[color:var(--color-text)]">
              {readyCount}/{playerList.length}
            </p>
          </div>
          {room && !room.is_public && (
            <div>
              <p className="text-xs uppercase tracking-wide text-[color:var(--color-text-faint)]">Room Code</p>
              <p className="text-lg font-bold text-[color:var(--color-text)]">{room.code}</p>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setHistoryOpen(true)}>
            History
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setChatOpen(true)}>
            Chat
          </Button>
        </div>
      </header>

      {game.paused && (
        <p className="rounded-md border border-[color:var(--color-red)] bg-[color:var(--color-surface)] px-4 py-2 text-sm text-[color:var(--color-red)]">
          The host has paused the game.
        </p>
      )}

      <CircularBoard
        lastRoll={lastRoll}
        players={playerList.map((p) => ({
          profileId: p.profile_id,
          tokenColor: roomPlayers.find((rp) => rp.profile_id === p.profile_id)?.token_color ?? null,
        }))}
      />

      <PhaseCenterPanel phase={game.phase} globalEvent={globalEvent} personalEvent={personalEvent} incomeSummary={incomeSummary} />

      <div className="flex flex-col gap-3">
        {isHost && (
          <HostControlPanel
            gameId={game.id}
            phase={game.phase}
            paused={game.paused}
            players={playerList.map((p) => ({ profileId: p.profile_id, username: profiles[p.profile_id]?.username ?? 'Player' }))}
            selfProfileId={profile.id}
          />
        )}

        <PlayerDashboard player={self} age={game.age} />

        <BankPanel gameId={game.id} assets={assets} debts={debts} cash={self.cash} market={market} />

        <HandGrid gameId={game.id} hand={hand} market={market} cash={self.cash} buyable={game.phase === 2} />

        {readyError && <p className="text-sm text-[color:var(--color-red)]">{readyError}</p>}
        <Button
          className="self-end"
          variant={self.ready ? 'secondary' : 'primary'}
          onClick={handleToggleReady}
          loading={togglingReady}
          disabled={game.paused}
        >
          {self.ready ? 'Not Ready' : 'Ready'}
        </Button>
      </div>

      <Modal open={chatOpen} onClose={() => setChatOpen(false)} title="Chat" maxWidthClassName="max-w-sm">
        {profile && <div className="h-96">{roomId && <ChatPanel roomId={roomId} profileId={profile.id} />}</div>}
      </Modal>

      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title="History" maxWidthClassName="max-w-md">
        <div className="flex max-h-96 flex-col gap-3 overflow-y-auto">
          {history.length === 0 && <p className="text-sm text-[color:var(--color-text-faint)]">Nothing has happened yet.</p>}
          {[...history].reverse().map((h) => (
            <div key={h.id} className="border-b border-[color:var(--color-border)] pb-2 last:border-b-0">
              <p className="text-xs text-[color:var(--color-text-faint)]">Age {h.age}</p>
              <p className="text-sm font-medium text-[color:var(--color-text)]">{h.title}</p>
              <p className="text-xs text-[color:var(--color-text-muted)]">{h.description}</p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
