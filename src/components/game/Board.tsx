import { useMemo } from 'react'
import { BOARD } from '@/content/board'
import { SPACE_THEME } from './boardTheme'
import { Token } from './Token'
import type { PlayerState } from '@/engine/types'
import type { ReactNode } from 'react'

interface BoardProps {
  players: PlayerState[]
  currentTurnPlayerId?: string
  centerContent: ReactNode
}

function gridPosition(id: number): { row: number; col: number } {
  if (id <= 10) return { row: 11, col: 11 - id }
  if (id <= 20) return { row: 11 - (id - 10), col: 1 }
  if (id <= 30) return { row: 1, col: 1 + (id - 20) }
  return { row: 1 + (id - 30), col: 11 }
}

export function Board({ players, currentTurnPlayerId, centerContent }: BoardProps) {
  const occupantsByPosition = useMemo(() => {
    const map = new Map<number, PlayerState[]>()
    for (const player of players) {
      const list = map.get(player.position)
      if (list) list.push(player)
      else map.set(player.position, [player])
    }
    return map
  }, [players])

  return (
    <div
      className="grid aspect-square w-full gap-1 rounded-2xl bg-surface-900/60 p-2"
      style={{ gridTemplateColumns: 'repeat(11, 1fr)', gridTemplateRows: 'repeat(11, 1fr)' }}
    >
      {BOARD.map((space) => {
        const { row, col } = gridPosition(space.id)
        const theme = SPACE_THEME[space.type]
        const occupants = occupantsByPosition.get(space.id) ?? []
        const isCorner = space.id % 10 === 0

        return (
          <div
            key={space.id}
            style={{ gridRow: row, gridColumn: col }}
            title={`${space.name} — ${space.description}`}
            className={`relative flex flex-col items-center justify-center overflow-hidden rounded-md border p-0.5 text-center ${theme.className} ${isCorner ? 'text-sm' : 'text-[8px] sm:text-[9px]'}`}
          >
            <span className={isCorner ? 'text-lg' : 'text-xs'}>{theme.icon}</span>
            <span className="hidden truncate px-0.5 leading-tight sm:block">{space.name}</span>
            {occupants.length > 0 && (
              <div className="absolute bottom-0.5 left-0 right-0 flex flex-wrap items-center justify-center gap-0.5 px-0.5">
                {occupants.map((p) => (
                  <Token
                    key={p.id}
                    playerId={p.id}
                    color={p.tokenColor}
                    initial={p.name[0]?.toUpperCase() ?? '?'}
                    isCurrentTurn={p.id === currentTurnPlayerId}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}

      <div
        style={{ gridRow: '2 / 11', gridColumn: '2 / 11' }}
        className="flex items-center justify-center rounded-xl bg-surface-950/40"
      >
        {centerContent}
      </div>
    </div>
  )
}
