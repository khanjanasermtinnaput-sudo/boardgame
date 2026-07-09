import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useRoomStore } from '@/stores/roomStore'
import { sendChatMessage } from '@/lib/rooms'

interface ChatPanelProps {
  roomId: string
  profileId: string
}

export function ChatPanel({ roomId, profileId }: ChatPanelProps) {
  const messages = useRoomStore((s) => s.messages)
  const profiles = useRoomStore((s) => s.profiles)
  const [input, setInput] = useState('')

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const body = input.trim().slice(0, 500)
    if (!body) return
    setInput('')
    await sendChatMessage(roomId, profileId, body)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto pr-1">
        {messages.map((m) => (
          <div key={m.id} className="mb-2 text-sm">
            <span className="font-medium text-[color:var(--color-text)]">{profiles[m.profile_id]?.username ?? 'Player'}: </span>
            <span className="text-[color:var(--color-text-muted)]">{m.body}</span>
          </div>
        ))}
        {messages.length === 0 && <p className="text-sm text-[color:var(--color-text-faint)]">No messages yet.</p>}
      </div>
      <form onSubmit={handleSend} className="mt-2 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          maxLength={500}
          className="h-10 flex-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 text-sm text-[color:var(--color-text)] outline-none focus:border-[color:var(--color-red)]"
        />
        <Button type="submit" size="sm">
          Send
        </Button>
      </form>
    </div>
  )
}
