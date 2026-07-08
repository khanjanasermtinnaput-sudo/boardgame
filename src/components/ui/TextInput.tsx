import { type InputHTMLAttributes, forwardRef, useId } from 'react'
import clsx from 'clsx'

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  /** Focus accent color — defaults to the app's emerald; 'red' for flat/minimal surfaces like login. */
  accent?: 'emerald' | 'red'
}

const focusClasses: Record<'emerald' | 'red', string> = {
  emerald: 'focus:border-emerald-glow/60',
  red: 'focus:border-[#DC2626]',
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { label, error, accent = 'emerald', className, id, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-surface-300">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={clsx(
          'h-11 rounded-xl bg-white/[0.05] border border-white/10 px-4 text-surface-50 placeholder:text-surface-400',
          'outline-none transition-colors focus:bg-white/[0.07]',
          focusClasses[accent],
          error && 'border-rose-glow/60',
          className,
        )}
        {...props}
      />
      {error && <span className="text-xs text-rose-glow">{error}</span>}
    </div>
  )
})
