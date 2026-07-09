import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  onClose?: () => void
  title?: string
  children: ReactNode
  maxWidthClassName?: string
}

export function Modal({ open, onClose, title, children, maxWidthClassName = 'max-w-md' }: ModalProps) {
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${maxWidthClassName} rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="mb-4 text-lg font-semibold text-[color:var(--color-text)]">{title}</h2>}
        {children}
      </div>
    </div>,
    document.body,
  )
}
