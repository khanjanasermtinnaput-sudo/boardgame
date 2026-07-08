import { useEffect, useRef } from 'react'
import type { LogEntry } from '@/engine/types'

interface GameLogProps {
  entries: LogEntry[]
}

export function GameLog({ entries }: GameLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries.length])

  return (
    <div className="flex h-full flex-col overflow-y-auto pr-1 text-xs">
      {entries.slice(-100).map((entry) => (
        <p key={entry.seq} className="mb-1.5 text-surface-400">
          {entry.message}
        </p>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
