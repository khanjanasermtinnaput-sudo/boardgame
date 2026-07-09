import { useMemo } from 'react'
import clsx from 'clsx'
import { Panel } from '@/components/ui/Panel'
import { tileRingPositions } from '@/engine/board'
import { tokenColorHex } from '@/lib/tokenColors'
import type { RollState } from '@/engine/types'

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
const BOARD_SIZE = 120
const CENTER = BOARD_SIZE / 2
const RING_RADIUS = 44

interface CircularBoardPlayer {
  profileId: string
  tokenColor: string | null
}

interface CircularBoardProps {
  lastRoll: RollState | null
  players: CircularBoardPlayer[]
  tileCount?: number
}

/** Thematic circular board: a ring of tiles, dice faces, and player tokens that
 * converge on the round's freshly-randomized landed tile. Purely cosmetic —
 * tile outcomes are not persistent per-position state. */
export function CircularBoard({ lastRoll, players, tileCount = 12 }: CircularBoardProps) {
  const positions = useMemo(() => tileRingPositions(tileCount, RING_RADIUS), [tileCount])
  const landedIndex = lastRoll ? lastRoll.tile_index : null
  const landedPos = landedIndex !== null ? positions[landedIndex] : undefined

  return (
    <Panel className="flex flex-col items-center gap-4 p-6">
      <div className="relative" style={{ width: BOARD_SIZE, height: BOARD_SIZE }}>
        {positions.map((pos, i) => (
          <div
            key={i}
            className={clsx(
              'absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-colors duration-500',
              i === landedIndex
                ? 'border-[color:var(--color-red)] bg-[color:var(--color-red)]'
                : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-alt)]',
            )}
            style={{ left: CENTER + pos.x, top: CENTER + pos.y }}
          />
        ))}
        {players.map((p, i) => {
          const jitter = players.length > 1 ? (i - (players.length - 1) / 2) * 6 : 0
          const x = (landedPos?.x ?? 0) + jitter
          const y = landedPos?.y ?? 0
          return (
            <div
              key={p.profileId}
              className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[color:var(--color-bg)] transition-[left,top] duration-700 ease-out"
              style={{ left: CENTER + x, top: CENTER + y, backgroundColor: tokenColorHex(p.tokenColor) }}
            />
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-4xl" aria-hidden>
          {lastRoll && lastRoll.die1 >= 1 && lastRoll.die1 <= 6 ? DICE_FACES[lastRoll.die1 - 1] : '🎲'}
        </span>
        <span className="text-4xl" aria-hidden>
          {lastRoll && lastRoll.die2 >= 1 && lastRoll.die2 <= 6 ? DICE_FACES[lastRoll.die2 - 1] : '🎲'}
        </span>
        {lastRoll && <span className="text-sm text-[color:var(--color-text-muted)]">Total: {lastRoll.total}</span>}
      </div>
    </Panel>
  )
}
