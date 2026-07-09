import { type ButtonHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-[color:var(--color-red)] text-white hover:bg-[color:var(--color-red-hover)] disabled:hover:bg-[color:var(--color-red)]',
  secondary:
    'bg-[color:var(--color-surface)] text-[color:var(--color-text)] border border-[color:var(--color-border)] hover:bg-[color:var(--color-surface-alt)]',
  ghost: 'text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface)]',
  danger: 'bg-[color:var(--color-red-soft)] text-white hover:bg-[color:var(--color-red)]',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm rounded-md gap-1.5',
  md: 'h-11 px-5 text-sm rounded-md gap-2',
  lg: 'h-13 px-7 text-base rounded-md gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-medium',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-red)]/60',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading && <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent" aria-hidden />}
      {children}
    </button>
  )
})
