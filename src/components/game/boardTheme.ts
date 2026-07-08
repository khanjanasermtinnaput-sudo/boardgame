import type { SpaceType } from '@/engine/types'

export interface SpaceTheme {
  icon: string
  className: string
}

export const SPACE_THEME: Record<SpaceType, SpaceTheme> = {
  payday: { icon: '💰', className: 'bg-emerald-glow/20 border-emerald-glow/50 text-emerald-glow' },
  salary: { icon: '💵', className: 'bg-emerald-glow/15 border-emerald-glow/40 text-emerald-glow' },
  investment: { icon: '📈', className: 'bg-sky-glow/15 border-sky-glow/40 text-sky-glow' },
  business: { icon: '🏪', className: 'bg-gold-glow/15 border-gold-glow/40 text-gold-glow' },
  real_estate: { icon: '🏠', className: 'bg-violet-glow/15 border-violet-glow/40 text-violet-glow' },
  market: { icon: '🔔', className: 'bg-sky-glow/20 border-sky-glow/50 text-sky-glow' },
  tax: { icon: '🧾', className: 'bg-rose-glow/15 border-rose-glow/40 text-rose-glow' },
  event: { icon: '🎴', className: 'bg-violet-glow/20 border-violet-glow/50 text-violet-glow' },
  loan: { icon: '🏦', className: 'bg-surface-600/40 border-surface-400/40 text-surface-200' },
  auction: { icon: '🔨', className: 'bg-gold-glow/25 border-gold-glow/60 text-gold-glow' },
  insurance: { icon: '🛡️', className: 'bg-sky-glow/15 border-sky-glow/40 text-sky-glow' },
  education: { icon: '🎓', className: 'bg-violet-glow/15 border-violet-glow/40 text-violet-glow' },
  economic_crisis: { icon: '⚠️', className: 'bg-rose-glow/25 border-rose-glow/60 text-rose-glow' },
  bonus: { icon: '🎁', className: 'bg-emerald-glow/15 border-emerald-glow/40 text-emerald-glow' },
  charity: { icon: '❤️', className: 'bg-rose-glow/10 border-rose-glow/30 text-rose-glow' },
  vacation: { icon: '🏖️', className: 'bg-gold-glow/20 border-gold-glow/50 text-gold-glow' },
  random: { icon: '🎲', className: 'bg-fuchsia-400/15 border-fuchsia-400/40 text-fuchsia-300' },
}
