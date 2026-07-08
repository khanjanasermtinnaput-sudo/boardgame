import { motion } from 'framer-motion'
import { tokenColorHex } from '@/lib/tokenColors'

interface TokenProps {
  playerId: string
  color: string
  initial: string
  isCurrentTurn?: boolean
}

export function Token({ playerId, color, initial, isCurrentTurn }: TokenProps) {
  const hex = tokenColorHex(color)

  return (
    <motion.div
      layoutId={`token-${playerId}`}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-surface-950 shadow"
      style={{
        backgroundColor: hex,
        boxShadow: isCurrentTurn ? `0 0 0 2px white, 0 0 10px 2px ${hex}` : undefined,
      }}
      title={playerId}
    >
      {initial}
    </motion.div>
  )
}
