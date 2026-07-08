import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
import { BUSINESSES_BY_ID } from '@/content/businesses'
import { PROPERTIES_BY_ID } from '@/content/properties'
import { money } from '@/lib/format'
import type { AuctionOffer } from '@/engine/types'

interface AuctionBannerProps {
  offer: AuctionOffer | null
  canAct: boolean
  onBuy: () => void
}

export function AuctionBanner({ offer, canAct, onBuy }: AuctionBannerProps) {
  if (!offer) return null
  const name = offer.kind === 'business' ? BUSINESSES_BY_ID.get(offer.id)?.name : PROPERTIES_BY_ID.get(offer.id)?.name

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        <GlassCard className="flex items-center gap-3 border-gold-glow/40 p-4">
          <span className="text-2xl">🔨</span>
          <div className="flex-1">
            <p className="font-medium text-surface-50">Auction: {name}</p>
            <p className="text-xs text-surface-400">25% off — {money(offer.price)}, this turn only</p>
          </div>
          <Button size="sm" disabled={!canAct} onClick={onBuy}>
            Bid
          </Button>
        </GlassCard>
      </motion.div>
    </AnimatePresence>
  )
}
