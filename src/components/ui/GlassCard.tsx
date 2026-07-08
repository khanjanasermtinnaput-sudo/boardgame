import type { HTMLAttributes } from 'react'
import clsx from 'clsx'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  solid?: boolean
}

export function GlassCard({ solid = false, className, children, ...props }: GlassCardProps) {
  return (
    <div className={clsx(solid ? 'glass-panel-solid' : 'glass-panel', 'rounded-2xl', className)} {...props}>
      {children}
    </div>
  )
}
