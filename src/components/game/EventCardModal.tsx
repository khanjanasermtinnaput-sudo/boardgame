import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/Button'
import type { EventCard, EventCategory } from '@/engine/types'

const CATEGORY_COLOR: Record<EventCategory, string> = {
  positive: 'text-emerald-glow border-emerald-glow/40',
  negative: 'text-rose-glow border-rose-glow/40',
  neutral: 'text-surface-300 border-surface-400/40',
  economic: 'text-sky-glow border-sky-glow/40',
  business: 'text-gold-glow border-gold-glow/40',
  family: 'text-violet-glow border-violet-glow/40',
  health: 'text-rose-glow border-rose-glow/40',
  investment: 'text-sky-glow border-sky-glow/40',
  tax: 'text-gold-glow border-gold-glow/40',
}

interface EventCardModalProps {
  card: EventCard | null
  canAck: boolean
  onAck: () => void
}

export function EventCardModal({ card, canAck, onAck }: EventCardModalProps) {
  return createPortal(
    <AnimatePresence>
      {card && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            style={{ transformStyle: 'preserve-3d' }}
            className={`glass-panel-solid w-full max-w-sm rounded-2xl border-2 p-6 text-center ${CATEGORY_COLOR[card.category]}`}
          >
            <span className="text-xs font-semibold uppercase tracking-wide">{card.category}</span>
            <h3 className="mt-2 font-display text-xl font-bold text-surface-50">{card.title}</h3>
            <p className="mt-3 text-sm text-surface-300">{card.flavor}</p>
            <Button className="mt-6 w-full" onClick={onAck} disabled={!canAck}>
              Continue
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
