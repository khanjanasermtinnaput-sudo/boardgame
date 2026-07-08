import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'red'
type Size = 'sm' | 'md' | 'lg'

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
>

interface ButtonProps extends NativeButtonProps {
  variant?: Variant
  size?: Size
  loading?: boolean
  /** Skip the tap-scale micro-interaction — for flat/minimal surfaces (e.g. the login page) that ask for no animation. */
  motionless?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-emerald-glow text-surface-950 hover:bg-emerald-400 shadow-[var(--shadow-glow-emerald)] disabled:hover:bg-emerald-glow focus-visible:ring-emerald-glow/60',
  secondary: 'glass-panel text-surface-100 hover:bg-white/[0.08] focus-visible:ring-emerald-glow/60',
  ghost: 'text-surface-200 hover:bg-white/[0.06] focus-visible:ring-emerald-glow/60',
  danger: 'bg-rose-glow/90 text-surface-50 hover:bg-rose-glow focus-visible:ring-emerald-glow/60',
  // Flat red — GitHub/Stripe/Linear-style primary action, no glow/shadow.
  red: 'bg-[#DC2626] text-white hover:bg-[#991B1B] disabled:hover:bg-[#DC2626] focus-visible:ring-[#DC2626]/60',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm rounded-lg gap-1.5',
  md: 'h-11 px-5 text-sm rounded-xl gap-2',
  lg: 'h-13 px-7 text-base rounded-2xl gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, motionless = false, disabled, className, children, ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={motionless ? undefined : { scale: 0.97 }}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-medium',
        motionless ? 'transition-none' : 'transition-colors',
        'focus-visible:outline-none focus-visible:ring-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      )}
      {children}
    </motion.button>
  )
})
