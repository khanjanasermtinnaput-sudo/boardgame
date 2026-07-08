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
            <span className="font-medium text-surface-200">{profiles[m.profile_id]?.username ?? 'Player'}: </span>
            <span className="text-surface-400">{m.body}</span>
          </div>
        ))}
        {messages.length === 0 && <p className="text-sm text-surface-500">No messages yet.</p>}
      </div>
      <form onSubmit={handleSend} className="mt-2 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          maxLength={500}
          className="h-10 flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-sm text-surface-50 outline-none focus:border-emerald-glow/60"
        />
        <Button type="submit" size="sm">
          Send
        </Button>
      </form>
    </div>
  )
}
