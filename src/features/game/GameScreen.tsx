import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Board } from '@/components/game/Board'
import { Dice3D } from '@/components/game/Dice3D'
import { MarketTicker } from '@/components/game/MarketTicker'
import { PlayerDashboard } from '@/components/game/PlayerDashboard'
import { EventCardModal } from '@/components/game/EventCardModal'
import { AuctionBanner } from '@/components/game/AuctionBanner'
import { GameLog } from '@/components/game/GameLog'
import { ChatPanel } from '@/components/game/ChatPanel'
import { ActionDrawer } from '@/features/game/ActionDrawer'
import { EndGameScreen } from '@/features/endgame/EndGameScreen'
import { useAuthStore } from '@/stores/authStore'
import { useRoomStore } from '@/stores/roomStore'
import { useGameStore } from '@/stores/gameStore'
import { useRealtimeRoom } from '@/hooks/useRealtimeRoom'
import { useGameSync } from '@/hooks/useGameSync'
import { useHostGameLoop } from '@/hooks/useHostGameLoop'
import { dispatchGameAction } from '@/net/actions'
import { EVENT_CARDS_BY_ID } from '@/content/events'
import type { GameAction } from '@/engine/actions'

export function GameScreen() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const room = useRoomStore((s) => s.room)
  const gameId = useGameStore((s) => s.gameId)
  const state = useGameStore((s) => s.state)
  const gameSyncStatus = useGameStore((s) => s.status)

  const [rolling, setRolling] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [showLog, setShowLog] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const lastRollRef = useRef<string>('')

  useRealtimeRoom(roomId, profile?.id)
  useGameSync(roomId)

  const isHost = room?.host_id === profile?.id
  useHostGameLoop(roomId, gameId, isHost)

  useEffect(() => {
    const signature = state?.lastRoll ? state.lastRoll.join(',') + state.turnNumber : ''
    if (signature !== lastRollRef.current) {
      lastRollRef.current = signature
      setRolling(false)
    }
  }, [state?.lastRoll, state?.turnNumber])

  useEffect(() => {
    if (gameSyncStatus === 'not_found' && roomId) {
      navigate(`/room/${roomId}/lobby`, { replace: true })
    }
  }, [gameSyncStatus, roomId, navigate])

  if (!roomId || !profile) return null

  if (gameSyncStatus === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <p className="text-sm text-rose-glow">Couldn't load this game. Check your connection and try again.</p>
        <Button variant="secondary" onClick={() => navigate('/home')}>
          Back to Home
        </Button>
      </div>
    )
  }

  if (!state || !gameId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-surface-400">Loading game…</p>
      </div>
    )
  }

  if (state.phase === 'ended') {
    return <EndGameScreen state={state} roomId={roomId} selfProfileId={profile.id} />
  }

  const currentPlayer = state.players[state.turnIndex]
  const isMyTurn = currentPlayer?.id === profile.id
  const selfPlayerState = state.players.find((p) => p.id === profile.id)
  const pendingCard = state.pendingEventCardId ? EVENT_CARDS_BY_ID.get(state.pendingEventCardId) : undefined

  async function dispatch(action: GameAction) {
    if (!roomId || !gameId || !profile) return
    setActionError(null)
    try {
      const result = await dispatchGameAction({ roomId, gameId, profileId: profile.id, isHost }, action)
      if (!result.ok) setActionError(result.error ?? 'Action failed.')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed.')
    }
  }

  async function handleRoll() {
    setRolling(true)
    try {
      await dispatch({ type: 'ROLL_DICE' })
    } finally {
      // The lastRoll effect above clears this on success; this covers the
      // failure path so the button never gets stuck disabled forever.
      setRolling(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-surface-50">{room?.name ?? 'Net Worth'}</h1>
          <p className="text-xs text-surface-400">
            Round {state.round} · Turn {state.turnNumber + 1} ·{' '}
            {isMyTurn ? 'Your turn' : `${currentPlayer?.name ?? 'Someone'}'s turn`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setShowLog(true)}>
            History
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setShowChat(true)}>
            Chat
          </Button>
        </div>
      </header>

      <MarketTicker market={state.market} />

      {state.pendingAuction && (
        <AuctionBanner
          offer={state.pendingAuction}
          canAct={isMyTurn}
          onBuy={() => dispatch({ type: 'BUY_AUCTION_ITEM' })}
        />
      )}

      {actionError && <p className="text-sm text-rose-glow">{actionError}</p>}

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4">
          <Board
            players={state.players}
            currentTurnPlayerId={currentPlayer?.id}
            centerContent={
              <div className="flex flex-col items-center gap-3">
                <div className="flex gap-3">
                  <Dice3D value={state.lastRoll?.[0] ?? 1} rolling={rolling} />
                  <Dice3D value={state.lastRoll?.[1] ?? 1} rolling={rolling} />
                </div>
                {isMyTurn && state.phase === 'rolling' && (
                  <Button onClick={handleRoll} loading={rolling}>
                    Roll Dice
                  </Button>
                )}
                {isMyTurn && state.phase === 'action' && !state.pendingEventCardId && (
                  <Button variant="secondary" onClick={() => dispatch({ type: 'END_TURN' })}>
                    End Turn
                  </Button>
                )}
                {!isMyTurn && (
                  <p className="text-xs text-surface-400">Waiting for {currentPlayer?.name ?? 'player'}…</p>
                )}
              </div>
            }
          />

          {isMyTurn && state.phase === 'action' && selfPlayerState && !state.pendingEventCardId && (
            <ActionDrawer
              player={selfPlayerState}
              market={state.market}
              round={state.round}
              disabled={!isMyTurn}
              onDispatch={dispatch}
            />
          )}
        </div>

        <div className="flex flex-col gap-3">
          {state.players.map((p) => (
            <PlayerDashboard
              key={p.id}
              player={p}
              market={state.market}
              round={state.round}
              isCurrentTurn={p.id === currentPlayer?.id}
              isSelf={p.id === profile.id}
            />
          ))}
        </div>
      </div>

      <Modal open={showLog} onClose={() => setShowLog(false)} title="Game History">
        <div className="h-96">
          <GameLog entries={state.log} />
        </div>
      </Modal>

      <Modal open={showChat} onClose={() => setShowChat(false)} title="Chat">
        <div className="h-96">
          <ChatPanel roomId={roomId} profileId={profile.id} />
        </div>
      </Modal>

      <EventCardModal card={pendingCard ?? null} canAck={isMyTurn} onAck={() => dispatch({ type: 'ACK_EVENT_CARD' })} />
    </div>
  )
}
