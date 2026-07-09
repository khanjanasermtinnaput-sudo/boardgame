import type { HTMLAttributes } from 'react'
import clsx from 'clsx'

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  /** A slightly stronger background — for panels that need to stand out from a page that already has other panels on it (e.g. a modal-like card on top of a list). */
  solid?: boolean
}

export function Panel({ solid = false, className, children, ...props }: PanelProps) {
  return (
    <div
      className={clsx(
        'rounded-md border border-[color:var(--color-border)]',
        solid ? 'bg-[color:var(--color-surface-alt)]' : 'bg-[color:var(--color-surface)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
